import React, { useMemo } from "react";
import { Modal } from "../components/ui/Modal";

function Field({ label, children, hint }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint ? <div className="muted">{hint}</div> : null}
    </div>
  );
}

function stringifyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// PUBLIC_INTERFACE
export function RunnerPage({ config, onConfigChange, configIssues, onRun, running, lastRun }) {
  /** Configure MOCK/LIVE mode and run the Stock Check v1.2 model. */
  const mode = (config?.data_mode || "LIVE").toUpperCase();

  const outputSummary = useMemo(() => {
    if (!lastRun) return null;
    const top10 = (lastRun.results || []).slice(0, 10);
    const avg =
      top10.reduce((s, r) => s + Number(r["Predicted 1-Day % Growth"] || 0), 0) / (top10.length || 1);

    const growths = top10.map((r) => Number(r["Predicted 1-Day % Growth"] || 0));
    const m = avg;
    const variance =
      growths.length >= 2 ? growths.reduce((s, x) => s + (x - m) * (x - m), 0) / (growths.length - 1) : 0;
    const dispersion = Math.sqrt(variance);

    return { avgTop10: avg, dispersion };
  }, [lastRun]);

  return (
    <div className="twoCol">
      <div className="card">
        <div className="cardHeader">
          <div className="cardHeaderTitle">
            <h2>Run Configuration</h2>
            <p>MOCK / LIVE data mode</p>
          </div>
        </div>
        <div className="cardBody">
          {configIssues?.length ? (
            <div className="badge badgeDanger" style={{ marginBottom: 12 }}>
              <span className="badgeStrong">Fix:</span> {configIssues[0]}
            </div>
          ) : (
            <div className="badge" style={{ marginBottom: 12 }}>
              <span className="badgeStrong">OK:</span> Configuration valid
            </div>
          )}

          <Field
            label="Data Mode"
            hint="Default = LIVE (LIVE requires a real data integration; MOCK is deterministic for QA/CI/demos)."
          >
            <select
              className="select"
              value={mode}
              onChange={(e) => onConfigChange?.({ ...config, data_mode: e.target.value })}
            >
              <option value="LIVE">LIVE</option>
              <option value="MOCK">MOCK</option>
            </select>
          </Field>

          {mode === "MOCK" ? (
            <>
              <div className="row">
                <Field label="mock_seed" hint="Deterministic output when seed identical.">
                  <input
                    className="input"
                    type="number"
                    value={config.mock_seed}
                    onChange={(e) => onConfigChange?.({ ...config, mock_seed: Number(e.target.value) })}
                  />
                </Field>
                <Field label="mock_universe_size" hint="Must be ≥ 1000 (BRD requirement).">
                  <input
                    className="input"
                    type="number"
                    value={config.mock_universe_size}
                    onChange={(e) => onConfigChange?.({ ...config, mock_universe_size: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <div className="badge badgeWarn">
                <span className="badgeStrong">MOCK</span> Output will be clearly labeled MOCK.
              </div>
            </>
          ) : (
            <div className="badge badgeWarn">
              <span className="badgeStrong">LIVE</span> This build will fail until a real data adapter is integrated (no
              hallucinated data allowed).
            </div>
          )}

          <div className="hr" />

          <div className="btnRow" style={{ justifyContent: "space-between" }}>
            <button className="btn btnPrimary" onClick={onRun} disabled={running || (configIssues?.length ?? 0) > 0}>
              {running ? "Running..." : "Run Model"}
            </button>
            <span className="muted">
              Output contract is locked (column order + TRADE logic + INTC append).
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>TRADE / NO TRADE</h2>
              <p>Decision gates (does not alter rankings)</p>
            </div>
          </div>
          <div className="cardBody">
            {lastRun ? (
              <>
                <div className="btnRow">
                  <span className={lastRun.trade_header === "TRADE" ? "badge" : "badge badgeWarn"}>
                    <span className="badgeStrong">{lastRun.trade_header}</span>
                  </span>
                  {lastRun.sector_warning ? (
                    <span className="badge badgeWarn">
                      <span className="badgeStrong">Sector warning</span> ≥7 same sector in Top 10
                    </span>
                  ) : (
                    <span className="badge">
                      <span className="badgeStrong">Sector mix</span> OK
                    </span>
                  )}
                  <span className="badge">
                    <span className="badgeStrong">{lastRun.data_mode}</span>
                  </span>
                </div>

                <div className="hr" />

                <div className="kpiGrid">
                  <div className="kpi">
                    <div className="kpiTop">
                      <div>
                        <div className="kpiLabel">Avg Top 10</div>
                        <div className="kpiValue">{outputSummary ? `${outputSummary.avgTop10.toFixed(3)}%` : "—"}</div>
                      </div>
                      <div className="kpiIcon">μ</div>
                    </div>
                    <div className="kpiHint">Must be ≥ 0.50%.</div>
                  </div>

                  <div className="kpi">
                    <div className="kpiTop">
                      <div>
                        <div className="kpiLabel">Dispersion</div>
                        <div className="kpiValue">{outputSummary ? `${outputSummary.dispersion.toFixed(3)}%` : "—"}</div>
                      </div>
                      <div className="kpiIcon warn">σ</div>
                    </div>
                    <div className="kpiHint">Must be ≥ 0.60%.</div>
                  </div>

                  <div className="kpi">
                    <div className="kpiTop">
                      <div>
                        <div className="kpiLabel">Current Date</div>
                        <div className="kpiValue">{lastRun.current_date}</div>
                      </div>
                      <div className="kpiIcon">D</div>
                    </div>
                    <div className="kpiHint">Contract field.</div>
                  </div>

                  <div className="kpi">
                    <div className="kpiTop">
                      <div>
                        <div className="kpiLabel">Prediction Date</div>
                        <div className="kpiValue">{lastRun.prediction_date}</div>
                      </div>
                      <div className="kpiIcon danger">+1</div>
                    </div>
                    <div className="kpiHint">Contract field.</div>
                  </div>
                </div>
              </>
            ) : (
              <span className="muted">No run yet. Click “Run Model” to generate a ranking.</span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Output Contract Preview</h2>
              <p>Locked schema</p>
            </div>
          </div>
          <div className="cardBody">
            {lastRun ? (
              <div className="btnRow" style={{ justifyContent: "space-between" }}>
                <span className="muted">Includes Top 10 + appended INTC.</span>
                <ContractModalButton lastRun={lastRun} />
              </div>
            ) : (
              <span className="muted">Run the model to preview JSON output.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractModalButton({ lastRun }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button className="btn btnSmall" onClick={() => setOpen(true)}>
        View JSON
      </button>
      {open ? (
        <Modal
          title="Locked Output Contract (JSON)"
          onClose={() => setOpen(false)}
          footer={
            <div className="btnRow">
              <button className="btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          }
        >
          <pre
            className="textarea"
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            {stringifyJSON(lastRun)}
          </pre>
        </Modal>
      ) : null}
    </>
  );
}
