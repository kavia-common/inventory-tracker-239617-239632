import React, { useMemo } from "react";

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pct(n) {
  const v = Number(n) || 0;
  return `${v.toFixed(3)}%`;
}

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

// PUBLIC_INTERFACE
export function OutputPage({ lastRun }) {
  /** Present the locked output contract in a table with strict column order. */
  const rows = lastRun?.results || [];

  const normalizedRows = useMemo(() => {
    // Ensure only canonical keys are displayed and in order.
    return rows.map((r) => {
      const obj = {};
      for (const c of CANONICAL_COLUMNS) obj[c] = r?.[c] ?? null;
      return obj;
    });
  }, [rows]);

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardHeaderTitle">
          <h2>Ranked Results</h2>
          <p>{lastRun ? `${rows.length} rows (Top 10 + INTC)` : "No run yet"}</p>
        </div>
      </div>
      <div className="cardBody">
        {lastRun ? (
          <>
            <div className="btnRow" style={{ marginBottom: 12 }}>
              <span className={lastRun.trade_header === "TRADE" ? "badge" : "badge badgeWarn"}>
                <span className="badgeStrong">{lastRun.trade_header}</span>
              </span>
              <span className="badge">
                <span className="badgeStrong">{lastRun.data_mode}</span>
              </span>
              {lastRun.data_mode === "MOCK" ? (
                <span className="badge badgeWarn">
                  <span className="badgeStrong">MOCK</span> deterministic mode
                </span>
              ) : null}
              {lastRun.sector_warning ? (
                <span className="badge badgeWarn">
                  <span className="badgeStrong">Sector warning</span> ≥7 same sector
                </span>
              ) : null}
            </div>

            <div className="tableWrap" role="region" aria-label="Ranked results table">
              <table className="table" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    {CANONICAL_COLUMNS.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedRows.map((r, idx) => {
                    const isIntc = r.Ticker === "INTC";
                    return (
                      <tr key={`${r.Ticker}_${idx}`}>
                        <td style={{ fontWeight: 800 }}>{r.Rank ?? (isIntc ? "—" : "")}</td>
                        <td style={{ fontWeight: 900 }}>{r.Ticker}</td>
                        <td>{r["Company Name"]}</td>
                        <td>{r.Sector}</td>
                        <td>{money(r["Current Price"])}</td>
                        <td>{money(r["Predicted Price"])}</td>
                        <td>{pct(r["Predicted 1-Day % Growth"])}</td>
                        <td>{r["3-Month"] == null ? "—" : pct(r["3-Month"])}</td>
                        <td>{r["6-Month"] == null ? "—" : pct(r["6-Month"])}</td>
                        <td>{r["12-Month"] == null ? "—" : pct(r["12-Month"])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="hr" />
            <p className="muted" style={{ margin: 0 }}>
              Column order is locked per BRD v1.2 and must not change.
            </p>
          </>
        ) : (
          <span className="muted">Run the model from the Runner page to generate results.</span>
        )}
      </div>
    </div>
  );
}
