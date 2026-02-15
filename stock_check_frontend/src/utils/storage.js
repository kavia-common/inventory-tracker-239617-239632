const LS_KEY = "stock_check_v12_state";

/**
 * Config defaults:
 * - Default data_mode = LIVE (BRD)
 * - MOCK supports mock_seed and mock_universe_size
 */

export const DEFAULT_CONFIG = {
  config: {
    data_mode: "LIVE",
    mock_seed: 42,
    mock_universe_size: 1200,
  },
  lastRun: null,
};

// PUBLIC_INTERFACE
export function validateConfig(config) {
  /** Validate config and return list of issue strings. */
  const issues = [];
  const mode = (config?.data_mode || "LIVE").toUpperCase();
  if (mode !== "LIVE" && mode !== "MOCK") issues.push("data_mode must be 'MOCK' or 'LIVE'.");

  if (mode === "MOCK") {
    const seed = Number(config?.mock_seed);
    const n = Number(config?.mock_universe_size);

    if (!Number.isFinite(seed) || !Number.isInteger(seed)) issues.push("mock_seed must be an integer.");
    if (!Number.isFinite(n) || !Number.isInteger(n)) issues.push("mock_universe_size must be an integer.");
    if (Number.isFinite(n) && n < 1000) issues.push("mock_universe_size must be ≥ 1000.");
  }

  return issues;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function loadAppState(fallback) {
  /** Load app state from localStorage; returns fallback on failure. */
  const raw = localStorage.getItem(LS_KEY);
  const parsed = raw ? safeParse(raw) : null;
  if (!parsed || typeof parsed !== "object") return fallback;
  const config = parsed.config || fallback.config;
  const lastRun = parsed.lastRun || null;
  return { config, lastRun };
}

// PUBLIC_INTERFACE
export function saveAppState(state) {
  /** Persist app state to localStorage. */
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
