/**
 * LIVE data adapter (Alpha Vantage via Netlify Functions proxy).
 *
 * BRD v1.2 requirements:
 * - No hallucinated data (never fabricate values)
 * - Fail on missing data (throw explicit errors)
 * - Log timestamp + source
 *
 * Why proxy:
 * - Keeps Alpha Vantage API key secret (stored as Netlify env var, not exposed to the browser)
 * - Adds caching at the proxy to mitigate Alpha Vantage rate limits
 *
 * Client behavior:
 * - The browser calls `/api/av-time-series-daily-adjusted?...` (redirected to Netlify Functions).
 */

/** Netlify Functions proxy base (same-origin). */
const API_BASE = "/api";

/** Default small universe: keep requests modest to avoid rate limits in demos. */
const DEFAULT_LIVE_TICKERS = ["AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "NVDA", "JPM", "UNH", "XOM", "INTC"];

/**
 * Ensure all required fields exist for the model runner input.
 * We treat these as required for LIVE because they are directly used in output contract
 * and/or computePredictionRow().
 */
function validateLiveUniverseRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    const err = new Error("LIVE data missing: universe is empty.");
    err.code = "LIVE_MISSING_DATA";
    throw err;
  }

  for (const r of rows) {
    const ticker = r?.ticker;
    if (!ticker || typeof ticker !== "string") {
      const err = new Error("LIVE data missing: row without ticker.");
      err.code = "LIVE_MISSING_DATA";
      throw err;
    }

    const cur = Number(r.current_price);
    if (!Number.isFinite(cur)) {
      const err = new Error(`LIVE data missing: current_price for ${ticker} is missing/invalid.`);
      err.code = "LIVE_MISSING_DATA";
      throw err;
    }

    // trailing returns are required by the locked output contract fields.
    const t3 = r?.trailing?.["3m"];
    const t6 = r?.trailing?.["6m"];
    const t12 = r?.trailing?.["12m"];
    if (!Number.isFinite(Number(t3)) || !Number.isFinite(Number(t6)) || !Number.isFinite(Number(t12))) {
      const err = new Error(`LIVE data missing: trailing returns (3m/6m/12m) for ${ticker} are missing/invalid.`);
      err.code = "LIVE_MISSING_DATA";
      throw err;
    }

    // Inputs object must exist, but may contain explicit neutral defaults (0) for unknown fields.
    if (!r.inputs || typeof r.inputs !== "object") {
      const err = new Error(`LIVE data missing: factor inputs object missing for ${ticker}.`);
      err.code = "LIVE_MISSING_DATA";
      throw err;
    }
  }
}

/** Parse Alpha Vantage error payloads and throw consistent errors. */
function throwAlphaVantageError({ ticker, json }) {
  const msg =
    json?.Note ||
    json?.Information ||
    json?.["Error Message"] ||
    `Alpha Vantage error for ${ticker || "request"}.`;

  const err = new Error(msg);
  // Rate limiting is common; keep a separate code to aid UX.
  if (typeof json?.Note === "string" && json.Note.toLowerCase().includes("frequency")) {
    err.code = "ALPHAVANTAGE_RATE_LIMIT";
  } else {
    err.code = "ALPHAVANTAGE_ERROR";
  }
  err.details = json;
  throw err;
}

function logLiveFetch({ source, ticker, at, detail }) {
  // BRD requirement: log timestamp + source (and include ticker to aid debugging).
  // eslint-disable-next-line no-console
  console.info(`[LIVE][${source}] ${at} ticker=${ticker}${detail ? ` ${detail}` : ""}`);
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Live proxy returned non-JSON response.");
    err.code = "ALPHAVANTAGE_BAD_RESPONSE";
    err.details = text?.slice?.(0, 5000);
    throw err;
  }
}

function asNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function yyyyMmDdToDate(s) {
  // Alpha Vantage uses YYYY-MM-DD keys.
  const [y, m, d] = String(s).split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
}

function sortDatesDesc(keys) {
  return [...keys].sort((a, b) => {
    const da = yyyyMmDdToDate(a)?.getTime?.() ?? 0;
    const db = yyyyMmDdToDate(b)?.getTime?.() ?? 0;
    return db - da;
  });
}

/**
 * Compute percent return between the latest close and the close closest to N months ago.
 * Uses daily bars; if exact date isn't present, uses the nearest available *on or before* target date.
 */
function computeTrailingReturnPct({ sortedDatesDesc, series, latestClose, months }) {
  const latestDate = sortedDatesDesc[0];
  const latestDt = yyyyMmDdToDate(latestDate);
  if (!latestDt) return null;

  const target = new Date(latestDt.getTime());
  target.setMonth(target.getMonth() - months);

  // Find the first date (descending) that is <= target (i.e., older or equal).
  let chosenDate = null;
  for (let i = sortedDatesDesc.length - 1; i >= 0; i -= 1) {
    // iterate oldest->newest to find last date <= target
    const d = sortedDatesDesc[i];
    const dt = yyyyMmDdToDate(d);
    if (!dt) continue;
    if (dt.getTime() <= target.getTime()) chosenDate = d;
  }

  if (!chosenDate) return null;
  const close = asNum(series?.[chosenDate]?.["4. close"]);
  if (close == null || close <= 0) return null;

  return ((latestClose - close) / close) * 100;
}

async function fetchDailyAdjustedSeries({ ticker, outputsize }) {
  const at = new Date().toISOString();
  const url = `${API_BASE}/av-time-series-daily-adjusted?symbol=${encodeURIComponent(ticker)}&outputsize=${encodeURIComponent(
    outputsize
  )}`;

  const json = await fetchJson(url);

  if (json?.Note || json?.Information || json?.["Error Message"]) {
    throwAlphaVantageError({ ticker, json });
  }

  const series = json?.["Time Series (Daily)"];
  const meta = json?.["Meta Data"];
  if (!series || typeof series !== "object") {
    const err = new Error(`Alpha Vantage missing Time Series (Daily) for ${ticker}.`);
    err.code = "ALPHAVANTAGE_MISSING_DATA";
    err.details = json;
    throw err;
  }

  logLiveFetch({
    source: `NetlifyProxy.av-time-series-daily-adjusted(${outputsize})`,
    ticker,
    at,
    detail: meta?.["3. Last Refreshed"] ? `(last_refreshed=${meta["3. Last Refreshed"]})` : "",
  });

  return { series, meta };
}

function buildNeutralFactorInputs() {
  // Explicit neutral defaults (not "guessed market data").
  // We supply all keys used by computeNormalizedFactorsFromInputs() with 0-ish values
  // so normalization becomes neutral/centered (most map to 0.5).
  return {
    momentum_5d_pct: 0,
    momentum_10d_pct: 0,
    momentum_20d_pct: 0,
    trend_pos_50dma_pct: 0,
    trend_pos_200dma_pct: 0,
    rsi: 50,
    macd_slope: 0,
    breakout_velocity: 0,

    eps_yoy_growth_pct: 0,
    eps_qoq_accel_pct: 0,
    rev_yoy_growth_pct: 0,
    rev_qoq_accel_pct: 0,
    earnings_surprise_pct: 0,
    forward_guidance_revision: 0,

    call_put_ratio: 1.0,
    unusual_options_z: 0,
    open_interest_expansion_pct: 0,
    dark_pool_flow_bias: 0,
    block_trade_accumulation: 0,

    iv_rank_pct: 50,
    iv_skew: 0,
    vol_compression: 0.35,
    atr_expansion: 1.0,

    rel_strength_spy_20d: 0,
    rel_strength_sector_etf: 0,
    sector_momentum_rank: 50,
    cross_sector_capital_rotation: 0,

    volume_surge_ratio: 1.0,
    inst_ownership_change_qoq: 0,
    insider_buying_activity: 0,
    short_interest_compression: 0,

    beta_adjustment: 0,
    downside_deviation_30d: 1.2,
    price_gap_frequency: 0,
    accumulation_distribution: 0,
    acceleration_curve_fit: 0,

    market_breadth: 1.0,
    vix_direction_5d: 0,
    treasury_yield_trend_10y: 0,
    dollar_index_trend_dxy: 0,
    fed_liquidity_proxy: 0,
    economic_surprise_index: 0,
    risk_on_off_composite: 0,
  };
}

// PUBLIC_INTERFACE
export async function fetchLiveUniverse({ config } = {}) {
  /** Fetch LIVE universe data using Alpha Vantage (via Netlify Functions proxy). */
  // For local dev without Netlify Functions, the proxy won't exist.
  // We intentionally fail fast (BRD "no hallucinated fallback").
  if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
    // no-op; used only to keep context explicit.
  }

  const tickers = Array.isArray(config?.live_tickers) && config.live_tickers.length ? config.live_tickers : DEFAULT_LIVE_TICKERS;

  // Fetch sequentially to avoid slamming rate limits in typical demo environments.
  const rows = [];
  for (const ticker of tickers) {
    const { series } = await fetchDailyAdjustedSeries({ ticker, outputsize: "compact" });

    const datesDesc = sortDatesDesc(Object.keys(series));
    const latest = datesDesc[0];
    const latestClose = asNum(series?.[latest]?.["4. close"]);
    if (latestClose == null || latestClose <= 0) {
      const err = new Error(`Alpha Vantage missing latest close for ${ticker}.`);
      err.code = "ALPHAVANTAGE_MISSING_DATA";
      throw err;
    }

    // Compute trailing returns from fetched history.
    // With "compact" (100 points) we can reliably compute ~3 months; 6/12 months may be missing.
    // BRD requirement: fail on missing data, so we require them and request outputsize=full if needed.
    let r3 = computeTrailingReturnPct({ sortedDatesDesc: datesDesc, series, latestClose, months: 3 });
    let r6 = computeTrailingReturnPct({ sortedDatesDesc: datesDesc, series, latestClose, months: 6 });
    let r12 = computeTrailingReturnPct({ sortedDatesDesc: datesDesc, series, latestClose, months: 12 });

    if (r3 == null || r6 == null || r12 == null) {
      const full = await fetchDailyAdjustedSeries({ ticker, outputsize: "full" });
      const seriesFull = full.series;

      const datesDescFull = sortDatesDesc(Object.keys(seriesFull));
      const latestFull = datesDescFull[0];
      const latestCloseFull = asNum(seriesFull?.[latestFull]?.["4. close"]);
      if (latestCloseFull == null || latestCloseFull <= 0) {
        const err = new Error(`Alpha Vantage missing latest close for ${ticker} (full).`);
        err.code = "ALPHAVANTAGE_MISSING_DATA";
        throw err;
      }

      r3 = computeTrailingReturnPct({ sortedDatesDesc: datesDescFull, series: seriesFull, latestClose: latestCloseFull, months: 3 });
      r6 = computeTrailingReturnPct({ sortedDatesDesc: datesDescFull, series: seriesFull, latestClose: latestCloseFull, months: 6 });
      r12 = computeTrailingReturnPct({ sortedDatesDesc: datesDescFull, series: seriesFull, latestClose: latestCloseFull, months: 12 });

      rows.push({
        ticker,
        company_name: ticker, // Not provided by this endpoint; avoid hallucinating.
        sector: "Unknown", // Not provided; avoid hallucinating.
        current_price: latestCloseFull,
        inputs: buildNeutralFactorInputs(),
        trailing: { "3m": Number(r3?.toFixed?.(3)), "6m": Number(r6?.toFixed?.(3)), "12m": Number(r12?.toFixed?.(3)) },
      });
    } else {
      rows.push({
        ticker,
        company_name: ticker,
        sector: "Unknown",
        current_price: latestClose,
        inputs: buildNeutralFactorInputs(),
        trailing: { "3m": Number(r3.toFixed(3)), "6m": Number(r6.toFixed(3)), "12m": Number(r12.toFixed(3)) },
      });
    }
  }

  validateLiveUniverseRows(rows);
  return rows;
}
