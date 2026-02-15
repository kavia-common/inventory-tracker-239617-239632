/**
 * MOCK data generator for Stock Check v1.2.
 * Requirements:
 * - Deterministic output if seed identical
 * - Universe >= 1000 tickers (enforced in config validator)
 * - Realistic volatility distributions (approximated with mixed normal-ish)
 * - No negative prices
 * - Sector diversity simulated
 */

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Industrials",
  "Energy",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communication Services",
];

function mulberry32(seed) {
  // Fast deterministic PRNG.
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randnApprox(rng) {
  // Sum of uniforms approximates normal (CLT).
  let s = 0;
  for (let i = 0; i < 6; i += 1) s += rng();
  return (s - 3) / 1; // roughly mean 0, std ~0.7
}

function bounded(rng, mean, std, lo, hi) {
  const z = randnApprox(rng);
  return clamp(mean + z * std, lo, hi);
}

function makeTicker(i) {
  // Create plausible ticker symbols.
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = letters[i % 26];
  const b = letters[Math.floor(i / 26) % 26];
  const c = letters[Math.floor(i / (26 * 26)) % 26];
  const len = 3 + (i % 2); // 3-4 chars
  return len === 3 ? `${a}${b}${c}` : `${a}${b}${c}${letters[(i + 7) % 26]}`;
}

function companyNameFromTicker(t) {
  const suffixes = ["Holdings", "Systems", "Labs", "Technologies", "Group", "Industries", "Networks", "Partners"];
  return `${t} ${suffixes[t.charCodeAt(0) % suffixes.length]}`;
}

function makeReturns(rng) {
  // 3M/6M/12M percent returns, with plausible dispersion.
  const m3 = bounded(rng, 8, 18, -40, 80);
  const m6 = clamp(m3 + bounded(rng, 4, 14, -50, 90), -60, 140);
  const m12 = clamp(m6 + bounded(rng, 6, 20, -80, 180), -80, 260);
  return { m3, m6, m12 };
}

function makePrice(rng) {
  // Log-ish distribution: more small caps than mega.
  const base = Math.exp(bounded(rng, 3.2, 0.65, 1.0, 6.0)); // ~ 3 to 400
  return clamp(base, 2, 800);
}

function makeLiquidity(rng) {
  // Shares volume (in millions) and ownership/insider/short signals.
  const volumeSurge = clamp(1 + bounded(rng, 0.0, 0.35, -0.4, 1.2), 0.4, 3.0); // ratio vs 30d avg
  const instOwnChg = bounded(rng, 0.2, 1.2, -4, 6); // QoQ %
  const insiderBuy = bounded(rng, 0.1, 1.0, -3, 5); // net accumulation score
  const shortComp = bounded(rng, 0.0, 0.8, -3, 3); // days-to-cover trend score
  return { volumeSurge, instOwnChg, insiderBuy, shortComp };
}

function makeOptionsFlow(rng) {
  const callPut = clamp(bounded(rng, 1.2, 0.45, 0.2, 3.5), 0.2, 3.5);
  const unusual = clamp(bounded(rng, 0.0, 1.0, -2.5, 4.0), -2.5, 4.0); // z-score
  const oiExp = bounded(rng, 4, 12, -20, 60); // %
  const darkPool = bounded(rng, 0.0, 1.0, -3.0, 3.0); // bias
  const blockAcc = bounded(rng, 0.0, 1.0, -3.0, 3.0);
  return { callPut, unusual, oiExp, darkPool, blockAcc };
}

function makeVolatility(rng) {
  const ivRank = clamp(bounded(rng, 55, 20, 1, 99), 1, 99); // percentile
  const ivSkew = bounded(rng, 0.0, 0.6, -2.0, 2.0);
  const volComp = clamp(bounded(rng, 0.35, 0.18, 0.05, 1.2), 0.05, 1.2); // Boll width proxy
  const atrExp = clamp(bounded(rng, 1.0, 0.35, 0.3, 2.8), 0.3, 2.8); // vs baseline
  return { ivRank, ivSkew, volComp, atrExp };
}

function makeMacro(rng) {
  return {
    breadth: clamp(bounded(rng, 1.0, 0.25, 0.3, 1.8), 0.3, 1.8), // adv/decline
    vixDir: bounded(rng, 0.0, 0.8, -3.0, 3.0),
    tsy10yTrend: bounded(rng, 0.0, 0.7, -3.0, 3.0),
    dxyTrend: bounded(rng, 0.0, 0.6, -3.0, 3.0),
    fedLiq: bounded(rng, 0.0, 0.5, -2.0, 2.0),
    econSurprise: bounded(rng, 0.0, 1.0, -4.0, 4.0),
    riskOnOff: bounded(rng, 0.0, 1.0, -4.0, 4.0),
  };
}

// PUBLIC_INTERFACE
export function generateMockUniverse({ seed, universeSize }) {
  /** Generate deterministic mock universe with factor inputs. */
  const rng = mulberry32(Number.isFinite(Number(seed)) ? Number(seed) : 1);
  const macro = makeMacro(rng);

  const universe = [];
  for (let i = 0; i < universeSize; i += 1) {
    const ticker = makeTicker(i);
    const sector = pick(rng, SECTORS);
    const currentPrice = makePrice(rng);

    // Momentum/price structure proxies
    const mom5 = bounded(rng, 0.4, 1.2, -5, 6);
    const mom10 = clamp(mom5 + bounded(rng, 0.2, 1.0, -4, 6), -8, 10);
    const mom20 = clamp(mom10 + bounded(rng, 0.3, 1.2, -6, 10), -12, 16);

    const pos50 = bounded(rng, 1.2, 3.0, -12, 18); // % above/below
    const pos200 = bounded(rng, 2.0, 5.0, -25, 30);

    const rsi = clamp(bounded(rng, 52, 12, 5, 95), 5, 95);
    const macdSlope = bounded(rng, 0.0, 0.9, -3.0, 3.0);
    const breakoutVel = bounded(rng, -2.0, 4.0, -25, 12); // distance from 30d high (<=0 means near high)

    // Earnings/revenue proxies
    const epsYoy = bounded(rng, 10, 25, -60, 120);
    const epsQoqAcc = bounded(rng, 2, 10, -40, 80);
    const revYoy = bounded(rng, 8, 18, -40, 90);
    const revQoqAcc = bounded(rng, 1.5, 8, -35, 70);
    const earnSurprise = bounded(rng, 1.0, 5.5, -20, 25);
    const fwdGuidRev = bounded(rng, 0.0, 1.0, -4, 5); // net revisions score

    const options = makeOptionsFlow(rng);
    const vol = makeVolatility(rng);
    const liq = makeLiquidity(rng);

    // Relative strength/sector rotation proxies
    const rsSpy = bounded(rng, 1.0, 4.0, -18, 22);
    const rsSector = clamp(rsSpy + bounded(rng, 0.0, 2.2, -14, 16), -25, 30);
    const sectorMomRank = clamp(bounded(rng, 55, 18, 1, 99), 1, 99); // percentile
    const xSectorRotation = bounded(rng, 0.0, 1.0, -3.0, 3.0);

    // Risk compression proxies
    const betaAdj = bounded(rng, 0.0, 0.9, -3.0, 3.0);
    const downsideDev = clamp(bounded(rng, 1.4, 0.45, 0.4, 4.0), 0.4, 4.0);
    const gapFreq = clamp(bounded(rng, 0.0, 1.0, -3.0, 3.0), -3.0, 3.0);
    const accDist = bounded(rng, 0.0, 1.0, -3.0, 3.0);
    const accelCurve = bounded(rng, 0.0, 1.0, -3.0, 3.0);

    const returns = makeReturns(rng);

    universe.push({
      ticker,
      company_name: companyNameFromTicker(ticker),
      sector,
      current_price: currentPrice,

      // Inputs to compute 43 factors (some already factor-like proxies)
      inputs: {
        momentum_5d_pct: mom5,
        momentum_10d_pct: mom10,
        momentum_20d_pct: mom20,
        trend_pos_50dma_pct: pos50,
        trend_pos_200dma_pct: pos200,
        rsi: rsi,
        macd_slope: macdSlope,
        breakout_velocity: breakoutVel,

        eps_yoy_growth_pct: epsYoy,
        eps_qoq_accel_pct: epsQoqAcc,
        rev_yoy_growth_pct: revYoy,
        rev_qoq_accel_pct: revQoqAcc,
        earnings_surprise_pct: earnSurprise,
        forward_guidance_revision: fwdGuidRev,

        call_put_ratio: options.callPut,
        unusual_options_z: options.unusual,
        open_interest_expansion_pct: options.oiExp,
        dark_pool_flow_bias: options.darkPool,
        block_trade_accumulation: options.blockAcc,

        iv_rank_pct: vol.ivRank,
        iv_skew: vol.ivSkew,
        vol_compression: vol.volComp,
        atr_expansion: vol.atrExp,

        rel_strength_spy_20d: rsSpy,
        rel_strength_sector_etf: rsSector,
        sector_momentum_rank: sectorMomRank,
        cross_sector_capital_rotation: xSectorRotation,

        volume_surge_ratio: liq.volumeSurge,
        inst_ownership_change_qoq: liq.instOwnChg,
        insider_buying_activity: liq.insiderBuy,
        short_interest_compression: liq.shortComp,

        beta_adjustment: betaAdj,
        downside_deviation_30d: downsideDev,
        price_gap_frequency: gapFreq,
        accumulation_distribution: accDist,
        acceleration_curve_fit: accelCurve,

        market_breadth: macro.breadth,
        vix_direction_5d: macro.vixDir,
        treasury_yield_trend_10y: macro.tsy10yTrend,
        dollar_index_trend_dxy: macro.dxyTrend,
        fed_liquidity_proxy: macro.fedLiq,
        economic_surprise_index: macro.econSurprise,
        risk_on_off_composite: macro.riskOnOff,
      },

      trailing: {
        "3m": returns.m3,
        "6m": returns.m6,
        "12m": returns.m12,
      },
    });
  }

  return { universe, macro };
}
