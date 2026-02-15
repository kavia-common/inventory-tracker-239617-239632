import { computeNormalizedFactorsFromInputs, scorePredictedGrowthPct } from "./factors";
import { generateMockUniverse } from "./mockData";
import { fetchLiveUniverse } from "./liveData";

/**
 * Model runner implements BRD v1.2 engine:
 * - Rank full universe descending by predicted 1-day growth
 * - Select Top 10
 * - Append INTC
 * - Output locked contract with canonical column order
 */

function isoNow() {
  return new Date().toISOString();
}

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function stdev(nums) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v = nums.reduce((s, n) => s + (n - m) * (n - m), 0) / (nums.length - 1);
  return Math.sqrt(v);
}

function canonicalResultRow({
  rank,
  ticker,
  company_name,
  sector,
  current_price,
  predicted_price,
  predicted_1d_growth_pct,
  trailing,
}) {
  // Locked column order (Never Change)
  return {
    Rank: rank,
    Ticker: ticker,
    "Company Name": company_name,
    Sector: sector,
    "Current Price": current_price,
    "Predicted Price": predicted_price,
    "Predicted 1-Day % Growth": predicted_1d_growth_pct,
    "3-Month": trailing?.["3m"] ?? null,
    "6-Month": trailing?.["6m"] ?? null,
    "12-Month": trailing?.["12m"] ?? null,
  };
}

function ensureIntcRow(universe) {
  const found = universe.find((u) => u.ticker === "INTC");
  if (found) return found;

  // If missing in universe, we must still append INTC; in MOCK we create a plausible row.
  return {
    ticker: "INTC",
    company_name: "Intel Corporation",
    sector: "Technology",
    current_price: 40,
    inputs: {
      momentum_5d_pct: 0.3,
      momentum_10d_pct: 0.5,
      momentum_20d_pct: 1.0,
      trend_pos_50dma_pct: 1.5,
      trend_pos_200dma_pct: -2.0,
      rsi: 51,
      macd_slope: 0.1,
      breakout_velocity: -1.5,

      eps_yoy_growth_pct: 6,
      eps_qoq_accel_pct: 2,
      rev_yoy_growth_pct: 4,
      rev_qoq_accel_pct: 1,
      earnings_surprise_pct: 0.5,
      forward_guidance_revision: 0.1,

      call_put_ratio: 1.1,
      unusual_options_z: 0.2,
      open_interest_expansion_pct: 3,
      dark_pool_flow_bias: 0.1,
      block_trade_accumulation: 0.1,

      iv_rank_pct: 45,
      iv_skew: 0.0,
      vol_compression: 0.35,
      atr_expansion: 1.0,

      rel_strength_spy_20d: 0.2,
      rel_strength_sector_etf: 0.3,
      sector_momentum_rank: 55,
      cross_sector_capital_rotation: 0.0,

      volume_surge_ratio: 1.0,
      inst_ownership_change_qoq: 0.1,
      insider_buying_activity: 0.0,
      short_interest_compression: 0.0,

      beta_adjustment: 0.0,
      downside_deviation_30d: 1.2,
      price_gap_frequency: 0.0,
      accumulation_distribution: 0.0,
      acceleration_curve_fit: 0.0,

      market_breadth: 1.0,
      vix_direction_5d: 0.0,
      treasury_yield_trend_10y: 0.0,
      dollar_index_trend_dxy: 0.0,
      fed_liquidity_proxy: 0.0,
      economic_surprise_index: 0.0,
      risk_on_off_composite: 0.0,
    },
    trailing: { "3m": 3.5, "6m": 6.0, "12m": 12.0 },
  };
}

function computePredictionRow(u) {
  const nf = computeNormalizedFactorsFromInputs(u.inputs);
  const growthPct = scorePredictedGrowthPct(nf); // percent points
  const current = Number(u.current_price);
  const cur = Number.isFinite(current) ? current : 0;
  const predicted = cur * (1 + growthPct / 100);

  return {
    ...u,
    predicted_1d_growth_pct: Number(growthPct.toFixed(3)),
    predicted_price: Number(predicted.toFixed(2)),
  };
}

function sectorWarningForTop10(top10) {
  const counts = new Map();
  for (const r of top10) {
    const s = r.sector || "Unknown";
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  let max = 0;
  for (const v of counts.values()) max = Math.max(max, v);
  return max >= 7;
}

function tradeHeader(top10) {
  const growths = top10.map((r) => r.predicted_1d_growth_pct);
  const avgTop10 = mean(growths);
  const dispersion = stdev(growths);

  const okAvg = avgTop10 >= 0.5;
  const okDisp = dispersion >= 0.6;

  return okAvg && okDisp ? "TRADE" : "NO TRADE";
}

// PUBLIC_INTERFACE
export async function runModel({ config, current_date, prediction_date }) {
  /**
   * Run Stock Check v1.2 ranking engine and return locked output contract.
   * Params:
   * - config: { data_mode: 'MOCK'|'LIVE', mock_seed, mock_universe_size }
   * - current_date: YYYY-MM-DD
   * - prediction_date: YYYY-MM-DD
   */
  const created_at = isoNow();
  const data_mode = (config?.data_mode || "LIVE").toUpperCase();

  let universe;
  if (data_mode === "MOCK") {
    const seed = Number(config?.mock_seed ?? 1);
    const universeSize = Number(config?.mock_universe_size ?? 1000);
    const out = generateMockUniverse({ seed, universeSize });
    universe = out.universe;
  } else {
    // LIVE must fail on missing data; adapter throws if not configured.
    universe = await fetchLiveUniverse({ config });
  }

  const scored = universe.map(computePredictionRow);

  scored.sort((a, b) => (b.predicted_1d_growth_pct - a.predicted_1d_growth_pct));

  const top10 = scored.slice(0, 10).map((r, idx) => ({
    ...r,
    rank: idx + 1,
  }));

  const sector_warning = sectorWarningForTop10(top10);
  const trade_header = tradeHeader(top10);

  const results = top10.map((r) =>
    canonicalResultRow({
      rank: r.rank,
      ticker: r.ticker,
      company_name: r.company_name,
      sector: r.sector,
      current_price: Number(r.current_price.toFixed ? r.current_price.toFixed(2) : Number(r.current_price).toFixed(2)),
      predicted_price: r.predicted_price,
      predicted_1d_growth_pct: r.predicted_1d_growth_pct,
      trailing: r.trailing,
    })
  );

  const intc = computePredictionRow(ensureIntcRow(scored));
  results.push(
    canonicalResultRow({
      rank: null,
      ticker: "INTC",
      company_name: intc.company_name,
      sector: intc.sector,
      current_price: Number(Number(intc.current_price).toFixed(2)),
      predicted_price: intc.predicted_price,
      predicted_1d_growth_pct: intc.predicted_1d_growth_pct,
      trailing: intc.trailing,
    })
  );

  return {
    model_version: "Stock Check v1.2",
    data_mode,
    current_date,
    prediction_date,
    trade_header,
    sector_warning,
    results,
    created_at,
  };
}
