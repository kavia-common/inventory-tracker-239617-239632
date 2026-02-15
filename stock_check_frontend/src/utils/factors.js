/**
 * Stock Check v1.2 locked factor matrix (43 factors, total 100%).
 * All factors must be normalized prior to weighting.
 */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function norm01(value, min, max) {
  // Robust 0..1 scaler with clamping; if invalid range, return 0.5 neutral.
  const v = Number(value);
  if (!Number.isFinite(v)) return 0.5;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0.5;
  return clamp((v - min) / (max - min), 0, 1);
}

function normCentered(value, minAbs, maxAbs) {
  // Maps [-maxAbs..maxAbs] to [0..1] with 0 as 0.5
  const v = Number(value);
  if (!Number.isFinite(v)) return 0.5;
  const lo = -Math.abs(maxAbs);
  const hi = Math.abs(maxAbs);
  return norm01(clamp(v, lo, hi), lo, hi);
}

// Locked list: definitions and weights.
export const FACTORS_V12 = [
  // I. Momentum & Price Structure (18%)
  { id: 1, key: "momentum_5d", name: "5-Day Momentum", definition: "% change over 5 trading days", weightPct: 2.0 },
  { id: 2, key: "momentum_10d", name: "10-Day Momentum", definition: "% change over 10 days", weightPct: 2.0 },
  { id: 3, key: "momentum_20d", name: "20-Day Momentum", definition: "% change over 20 days", weightPct: 2.0 },
  { id: 4, key: "trend_pos_50dma", name: "50-Day Trend Position", definition: "% above/below 50DMA", weightPct: 2.5 },
  { id: 5, key: "trend_pos_200dma", name: "200-Day Trend Position", definition: "% above/below 200DMA", weightPct: 2.5 },
  { id: 6, key: "rsi_compression", name: "RSI Compression", definition: "RSI normalized 0–100", weightPct: 2.0 },
  { id: 7, key: "macd_slope", name: "MACD Slope", definition: "Rate of change of MACD", weightPct: 2.0 },
  { id: 8, key: "breakout_velocity", name: "Breakout Velocity", definition: "Distance from 30-day high", weightPct: 3.0 },

  // II. Earnings & Revenue Acceleration (16%)
  { id: 9, key: "eps_yoy_growth", name: "EPS YoY Growth", definition: "Year-over-year EPS growth", weightPct: 3.0 },
  { id: 10, key: "eps_qoq_accel", name: "EPS QoQ Acceleration", definition: "Sequential EPS acceleration", weightPct: 3.0 },
  { id: 11, key: "rev_yoy_growth", name: "Revenue YoY Growth", definition: "Revenue growth YoY", weightPct: 3.0 },
  { id: 12, key: "rev_qoq_accel", name: "Revenue QoQ Acceleration", definition: "Sequential revenue change", weightPct: 3.0 },
  { id: 13, key: "earnings_surprise", name: "Earnings Surprise", definition: "% beat vs estimates", weightPct: 2.0 },
  { id: 14, key: "forward_guidance_revision", name: "Forward Guidance Revision", definition: "Net analyst revisions", weightPct: 2.0 },

  // III. Options & Flow Signals (14%)
  { id: 15, key: "call_put_ratio", name: "Call/Put Volume Ratio", definition: "Bullish flow bias", weightPct: 3.0 },
  { id: 16, key: "unusual_options_activity", name: "Unusual Options Activity", definition: "Z-score abnormal flow", weightPct: 3.0 },
  { id: 17, key: "open_interest_expansion", name: "Open Interest Expansion", definition: "OI growth %", weightPct: 2.0 },
  { id: 18, key: "dark_pool_flow_bias", name: "Dark Pool Flow Bias", definition: "Institutional net prints", weightPct: 3.0 },
  { id: 19, key: "block_trade_accumulation", name: "Block Trade Accumulation", definition: "Large trade clustering", weightPct: 3.0 },

  // IV. Volatility Structure (10%)
  { id: 20, key: "iv_rank", name: "Implied Volatility Rank", definition: "IV percentile", weightPct: 2.5 },
  { id: 21, key: "iv_skew", name: "IV Skew", definition: "Call vs put skew", weightPct: 2.0 },
  { id: 22, key: "volatility_compression", name: "Volatility Compression", definition: "Bollinger width", weightPct: 2.5 },
  { id: 23, key: "atr_expansion", name: "ATR Expansion", definition: "ATR vs baseline", weightPct: 3.0 },

  // V. Relative Strength & Sector Rotation (12%)
  { id: 24, key: "rel_strength_spy", name: "Relative Strength vs SPY", definition: "20-day relative return", weightPct: 3.0 },
  { id: 25, key: "rel_strength_sector_etf", name: "Relative Strength vs Sector ETF", definition: "Relative sector performance", weightPct: 3.0 },
  { id: 26, key: "sector_momentum_rank", name: "Sector Momentum Rank", definition: "Sector percentile", weightPct: 3.0 },
  { id: 27, key: "cross_sector_rotation", name: "Cross-Sector Capital Rotation", definition: "ETF flow signals", weightPct: 3.0 },

  // VI. Liquidity & Institutional Behavior (10%)
  { id: 28, key: "volume_surge_ratio", name: "Volume Surge Ratio", definition: "Volume vs 30-day avg", weightPct: 3.0 },
  { id: 29, key: "institutional_ownership_change", name: "Institutional Ownership Change", definition: "QoQ change", weightPct: 2.5 },
  { id: 30, key: "insider_buying_activity", name: "Insider Buying Activity", definition: "Net insider accumulation", weightPct: 2.5 },
  { id: 31, key: "short_interest_compression", name: "Short Interest Compression", definition: "Days-to-cover trend", weightPct: 2.0 },

  // VII. Risk Compression & Acceleration (10%)
  { id: 32, key: "beta_adjustment", name: "Beta Adjustment", definition: "Risk-normalized return", weightPct: 2.0 },
  { id: 33, key: "downside_deviation", name: "Downside Deviation", definition: "30-day downside risk", weightPct: 2.0 },
  { id: 34, key: "price_gap_frequency", name: "Price Gap Frequency", definition: "Positive gaps", weightPct: 2.0 },
  { id: 35, key: "accumulation_distribution", name: "Accumulation/Distribution", definition: "Money flow trend", weightPct: 2.0 },
  { id: 36, key: "acceleration_curve_fit", name: "Acceleration Curve Fit", definition: "2nd derivative momentum", weightPct: 2.0 },

  // VIII. Macro Overlay Inputs (10%)
  { id: 37, key: "market_breadth", name: "Market Breadth", definition: "Adv/Decline ratio", weightPct: 2.0 },
  { id: 38, key: "vix_direction", name: "VIX Direction", definition: "5-day VIX trend", weightPct: 2.0 },
  { id: 39, key: "treasury_yield_trend", name: "Treasury Yield Trend", definition: "10Y trend", weightPct: 2.0 },
  { id: 40, key: "dollar_index_trend", name: "Dollar Index Trend", definition: "DXY trend", weightPct: 1.5 },
  { id: 41, key: "fed_liquidity_proxy", name: "Fed Liquidity Proxy", definition: "Balance sheet change", weightPct: 1.5 },
  { id: 42, key: "economic_surprise_index", name: "Economic Surprise Index", definition: "Macro surprise", weightPct: 0.5 },
  { id: 43, key: "risk_on_off_composite", name: "Risk-On / Risk-Off Composite", definition: "Cross-asset signal", weightPct: 0.5 },
];

export const FACTOR_WEIGHTS_TOTAL = FACTORS_V12.reduce((s, f) => s + f.weightPct, 0);

// PUBLIC_INTERFACE
export function computeNormalizedFactorsFromInputs(inputs) {
  /**
   * Convert raw inputs into 43 normalized factor values on [0..1] scale.
   * For this frontend-only build:
   * - We interpret the BRD factor definitions and normalize using conservative bounds.
   * - LIVE data adapter should provide the raw inputs with the same keys used in MOCK.
   */
  const x = inputs || {};

  return {
    // I
    momentum_5d: normCentered(x.momentum_5d_pct, 0, 8),
    momentum_10d: normCentered(x.momentum_10d_pct, 0, 12),
    momentum_20d: normCentered(x.momentum_20d_pct, 0, 18),
    trend_pos_50dma: normCentered(x.trend_pos_50dma_pct, 0, 25),
    trend_pos_200dma: normCentered(x.trend_pos_200dma_pct, 0, 40),
    rsi_compression: norm01(x.rsi, 0, 100),
    macd_slope: normCentered(x.macd_slope, 0, 3.0),
    // breakout velocity: "distance from 30d high" -> closer to high is better; negative/near 0 is best.
    breakout_velocity: 1 - norm01(clamp(Number(x.breakout_velocity), -30, 30), -30, 30),

    // II
    eps_yoy_growth: normCentered(x.eps_yoy_growth_pct, 0, 150),
    eps_qoq_accel: normCentered(x.eps_qoq_accel_pct, 0, 100),
    rev_yoy_growth: normCentered(x.rev_yoy_growth_pct, 0, 120),
    rev_qoq_accel: normCentered(x.rev_qoq_accel_pct, 0, 100),
    earnings_surprise: normCentered(x.earnings_surprise_pct, 0, 30),
    forward_guidance_revision: normCentered(x.forward_guidance_revision, 0, 6),

    // III
    call_put_ratio: norm01(x.call_put_ratio, 0.2, 3.5),
    unusual_options_activity: normCentered(x.unusual_options_z, 0, 5),
    open_interest_expansion: normCentered(x.open_interest_expansion_pct, 0, 70),
    dark_pool_flow_bias: normCentered(x.dark_pool_flow_bias, 0, 3.5),
    block_trade_accumulation: normCentered(x.block_trade_accumulation, 0, 3.5),

    // IV
    iv_rank: norm01(x.iv_rank_pct, 0, 100),
    iv_skew: normCentered(x.iv_skew, 0, 2.5),
    // Compression: lower width means tighter -> typically bullish breakout potential.
    volatility_compression: 1 - norm01(x.vol_compression, 0.05, 1.2),
    atr_expansion: norm01(x.atr_expansion, 0.3, 2.8),

    // V
    rel_strength_spy: normCentered(x.rel_strength_spy_20d, 0, 25),
    rel_strength_sector_etf: normCentered(x.rel_strength_sector_etf, 0, 30),
    sector_momentum_rank: norm01(x.sector_momentum_rank, 0, 100),
    cross_sector_rotation: normCentered(x.cross_sector_capital_rotation, 0, 3.5),

    // VI
    volume_surge_ratio: norm01(x.volume_surge_ratio, 0.4, 3.0),
    institutional_ownership_change: normCentered(x.inst_ownership_change_qoq, 0, 7),
    insider_buying_activity: normCentered(x.insider_buying_activity, 0, 6),
    short_interest_compression: normCentered(x.short_interest_compression, 0, 3.5),

    // VII
    beta_adjustment: normCentered(x.beta_adjustment, 0, 3.5),
    downside_deviation: 1 - norm01(x.downside_deviation_30d, 0.4, 4.0), // less downside risk better
    price_gap_frequency: normCentered(x.price_gap_frequency, 0, 3.5),
    accumulation_distribution: normCentered(x.accumulation_distribution, 0, 3.5),
    acceleration_curve_fit: normCentered(x.acceleration_curve_fit, 0, 3.5),

    // VIII
    market_breadth: norm01(x.market_breadth, 0.3, 1.8),
    // vix down is risk-on -> invert
    vix_direction: 1 - normCentered(x.vix_direction_5d, 0, 3.5),
    treasury_yield_trend: normCentered(x.treasury_yield_trend_10y, 0, 3.5),
    dollar_index_trend: 1 - normCentered(x.dollar_index_trend_dxy, 0, 3.5), // strong dollar often risk-off
    fed_liquidity_proxy: normCentered(x.fed_liquidity_proxy, 0, 2.5),
    economic_surprise_index: normCentered(x.economic_surprise_index, 0, 5),
    risk_on_off_composite: normCentered(x.risk_on_off_composite, 0, 5),
  };
}

// PUBLIC_INTERFACE
export function scorePredictedGrowthPct(normalizedFactors) {
  /**
   * Predicted_1Day_Growth_% = Σ (Normalized_Factor_i × Weight_i)
   * Interpreted as percent points (e.g., 0.75 means 0.75%).
   *
   * Since normalized factors are 0..1, this yields 0..100 (in percent points).
   * To create realistic daily growth magnitudes, we re-center to [-0.5..+1.5]% range:
   * - Convert weighted average (0..1) to centered [-0.5..+1.5].
   *
   * This keeps the BRD formula structure (weighted sum) while mapping to daily growth scale
   * for the frontend-only build.
   */
  const nf = normalizedFactors || {};
  let weightedSum = 0;
  let totalW = 0;

  for (const f of FACTORS_V12) {
    const v = Number(nf[f.key]);
    const vv = Number.isFinite(v) ? clamp(v, 0, 1) : 0.5;
    weightedSum += vv * f.weightPct;
    totalW += f.weightPct;
  }

  const avg01 = totalW ? weightedSum / totalW : 0.5; // 0..1
  const dailyPct = -0.5 + avg01 * 2.0; // -0.5% .. +1.5%
  return dailyPct;
}
