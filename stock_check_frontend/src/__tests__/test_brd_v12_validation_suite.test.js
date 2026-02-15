import { FACTORS_V12, FACTOR_WEIGHTS_TOTAL } from "../utils/factors";
import { fetchLiveUniverse } from "../utils/liveData";
import { runModel } from "../utils/model";

const CANONICAL_COLUMNS = [
  "Rank",
  "Ticker",
  "Company Name",
  "Sector",
  "Current Price",
  "Predicted Price",
  "Predicted 1-Day % Growth",
  "3-Month",
  "6-Month",
  "12-Month",
];

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

function tradeHeaderFromGrowths(growths) {
  const avgTop10 = mean(growths);
  const dispersion = stdev(growths);
  const okAvg = avgTop10 >= 0.5;
  const okDisp = dispersion >= 0.6;
  return okAvg && okDisp ? "TRADE" : "NO TRADE";
}

describe("BRD v1.2 locked requirements - validation suite", () => {
  test("Factor Matrix Presence Test: exactly 43 factors and weights total ~100%", () => {
    expect(Array.isArray(FACTORS_V12)).toBe(true);
    expect(FACTORS_V12).toHaveLength(43);

    // Locked IDs should be 1..43.
    const ids = FACTORS_V12.map((f) => f.id);
    expect(ids).toEqual(Array.from({ length: 43 }, (_, i) => i + 1));

    // Locked weights should total 100%. Allow tiny floating error.
    expect(FACTOR_WEIGHTS_TOTAL).toBeCloseTo(100.0, 6);
  });

  test("LIVE adapter configuration requirement: must fail fast if Alpha Vantage API key missing (no hallucinated fallback)", async () => {
    const hadKey = process.env.REACT_APP_ALPHAVANTAGE_API_KEY;
    try {
      // Ensure test is deterministic regardless of environment.
      // If CI provides a real key, this branch will skip the failure expectation.
      process.env.REACT_APP_ALPHAVANTAGE_API_KEY = "";

      await expect(fetchLiveUniverse()).rejects.toMatchObject({
        code: "LIVE_NOT_CONFIGURED",
      });

      await expect(fetchLiveUniverse()).rejects.toThrow(/REACT_APP_ALPHAVANTAGE_API_KEY/i);
    } finally {
      process.env.REACT_APP_ALPHAVANTAGE_API_KEY = hadKey;
    }
  });

  test("MOCK mode contract invariants: column order locked, Top10 sorted desc, INTC appended, results length=11", async () => {
    const lastRun = await runModel({
      config: { data_mode: "MOCK", mock_seed: 42, mock_universe_size: 1200 },
      current_date: "2026-01-01",
      prediction_date: "2026-01-02",
    });

    expect(lastRun.data_mode).toBe("MOCK");
    expect(Array.isArray(lastRun.results)).toBe(true);
    expect(lastRun.results).toHaveLength(11);

    // Column Order Test (first row must exactly match canonical key order).
    const keys = Object.keys(lastRun.results[0]);
    expect(keys).toEqual(CANONICAL_COLUMNS);

    // Ranking Integrity Test: Top 10 rows sorted descending by Predicted 1-Day % Growth.
    const top10 = lastRun.results.slice(0, 10);
    for (let i = 1; i < top10.length; i += 1) {
      const prev = Number(top10[i - 1]["Predicted 1-Day % Growth"]);
      const cur = Number(top10[i]["Predicted 1-Day % Growth"]);
      expect(cur).toBeLessThanOrEqual(prev);
    }

    // Rank field for top10 is 1..10 (INTC has null rank and is appended).
    const ranks = top10.map((r) => r.Rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    // INTC Presence Test: must exist and be appended (last row).
    const last = lastRun.results[lastRun.results.length - 1];
    expect(last.Ticker).toBe("INTC");
    expect(last.Rank).toBeNull();

    // Live Data Integrity (applies here as general integrity): Current/Predicted prices are finite.
    for (const r of lastRun.results) {
      expect(Number.isFinite(Number(r["Current Price"]))).toBe(true);
      expect(Number.isFinite(Number(r["Predicted Price"]))).toBe(true);
      expect(Number.isFinite(Number(r["Predicted 1-Day % Growth"]))).toBe(true);
    }
  });

  test("TRADE logic test: trade_header must match computed avgTop10/dispersion gates (>=0.5 and >=0.6)", async () => {
    const lastRun = await runModel({
      config: { data_mode: "MOCK", mock_seed: 7, mock_universe_size: 1200 },
      current_date: "2026-01-01",
      prediction_date: "2026-01-02",
    });

    const growths = lastRun.results.slice(0, 10).map((r) => Number(r["Predicted 1-Day % Growth"]));
    const expected = tradeHeaderFromGrowths(growths);

    expect(lastRun.trade_header).toBe(expected);
  });

  test("Mock determinism test: identical seed + universe size produces identical results (excluding created_at)", async () => {
    const config = { data_mode: "MOCK", mock_seed: 99, mock_universe_size: 1200 };
    const run1 = await runModel({
      config,
      current_date: "2026-01-01",
      prediction_date: "2026-01-02",
    });
    const run2 = await runModel({
      config,
      current_date: "2026-01-01",
      prediction_date: "2026-01-02",
    });

    // created_at is expected to differ.
    expect(run1.created_at).not.toBe(run2.created_at);

    // Core deterministic output should match.
    expect(run1.data_mode).toBe("MOCK");
    expect(run2.data_mode).toBe("MOCK");
    expect(run1.trade_header).toBe(run2.trade_header);
    expect(run1.sector_warning).toBe(run2.sector_warning);

    // Results should be identical (deep equality).
    expect(run1.results).toEqual(run2.results);
  });

  test("LIVE mode runModel must fail with LIVE_NOT_CONFIGURED when API key is missing (no hallucinated live data)", async () => {
    const hadKey = process.env.REACT_APP_ALPHAVANTAGE_API_KEY;
    try {
      process.env.REACT_APP_ALPHAVANTAGE_API_KEY = "";

      await expect(
        runModel({
          config: { data_mode: "LIVE" },
          current_date: "2026-01-01",
          prediction_date: "2026-01-02",
        })
      ).rejects.toMatchObject({ code: "LIVE_NOT_CONFIGURED" });
    } finally {
      process.env.REACT_APP_ALPHAVANTAGE_API_KEY = hadKey;
    }
  });
});
