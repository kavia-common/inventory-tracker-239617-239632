import React, { useMemo } from "react";
import { FACTORS_V12, FACTOR_WEIGHTS_TOTAL } from "../utils/factors";

// PUBLIC_INTERFACE
export function FactorsPage() {
  /** Display the locked v1.2 43-factor definitions and weights (read-only). */
  const sections = useMemo(() => {
    // Simple grouping by id ranges per BRD sections.
    const groups = [
      { title: "I. Momentum & Price Structure (18%)", from: 1, to: 8 },
      { title: "II. Earnings & Revenue Acceleration (16%)", from: 9, to: 14 },
      { title: "III. Options & Flow Signals (14%)", from: 15, to: 19 },
      { title: "IV. Volatility Structure (10%)", from: 20, to: 23 },
      { title: "V. Relative Strength & Sector Rotation (12%)", from: 24, to: 27 },
      { title: "VI. Liquidity & Institutional Behavior (10%)", from: 28, to: 31 },
      { title: "VII. Risk Compression & Acceleration (10%)", from: 32, to: 36 },
      { title: "VIII. Macro Overlay Inputs (10%)", from: 37, to: 43 },
    ];

    return groups.map((g) => ({
      ...g,
      items: FACTORS_V12.filter((f) => f.id >= g.from && f.id <= g.to),
    }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card">
        <div className="cardHeader">
          <div className="cardHeaderTitle">
            <h2>43‑Factor Matrix (Locked)</h2>
            <p>Definitions + weights (Total = {FACTOR_WEIGHTS_TOTAL.toFixed(1)}%)</p>
          </div>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Per BRD v1.2, factor definitions, weights, and ranking methodology are permanently frozen.
          </p>
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.title} className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>{s.title}</h2>
              <p>{s.items.length} factors</p>
            </div>
          </div>
          <div className="cardBody">
            <div className="tableWrap" role="region" aria-label={`${s.title} table`}>
              <table className="table" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>#</th>
                    <th style={{ width: 240 }}>Factor</th>
                    <th>Definition</th>
                    <th style={{ width: 120 }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {s.items.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 900 }}>{f.id}</td>
                      <td style={{ fontWeight: 800 }}>{f.name}</td>
                      <td className="muted" style={{ color: "var(--text-2)" }}>
                        {f.definition}
                      </td>
                      <td>{f.weightPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              All factors must be normalized prior to weighting.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
