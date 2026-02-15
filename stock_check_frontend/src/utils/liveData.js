/**
 * LIVE data adapter placeholder.
 *
 * BRD v1.2 requirements:
 * - No hallucinated data
 * - Fail on missing data
 * - Log timestamp + source
 *
 * This frontend-only container has no backend/data provider configured, so
 * LIVE mode must throw with actionable guidance until integrated.
 */

// PUBLIC_INTERFACE
export async function fetchLiveUniverse() {
  /** Fetch LIVE universe data. Throws until a real integration exists. */
  // NOTE: If a backend is later added, this should call REACT_APP_API_BASE endpoints
  // and validate presence of all required fields for factor inputs.
  const err = new Error(
    "LIVE mode is not configured in this frontend-only build. Per BRD v1.2, LIVE must not hallucinate; please integrate a real data source (backend/API) that returns the required price/history/flow/macro inputs."
  );
  err.code = "LIVE_NOT_CONFIGURED";
  throw err;
}
