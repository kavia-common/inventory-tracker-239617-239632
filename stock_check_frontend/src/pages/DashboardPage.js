import React, { useMemo } from "react";
import { buildAlerts, computeKpis } from "../utils/inventory";
import { InventoryTable } from "../components/inventory/InventoryTable";

// PUBLIC_INTERFACE
export function DashboardPage({ items, onEdit, onDelete, onCreateNew }) {
  /** Render dashboard KPIs and highlights. */
  const kpis = useMemo(() => computeKpis(items), [items]);
  const alerts = useMemo(() => buildAlerts(items).slice(0, 5), [items]);
  const preview = useMemo(() => (items || []).slice(0, 6), [items]);

  const valueFormatted = useMemo(() => {
    return kpis.inventoryValue.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }, [kpis.inventoryValue]);

  return (
    <div className="twoCol">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Overview</h2>
              <p>Real-time-ish stock visibility</p>
            </div>
          </div>
          <div className="cardBody">
            <div className="kpiGrid">
              <div className="kpi">
                <div className="kpiTop">
                  <div>
                    <div className="kpiLabel">SKUs</div>
                    <div className="kpiValue">{kpis.skuCount}</div>
                  </div>
                  <div className="kpiIcon">S</div>
                </div>
                <div className="kpiHint">Total distinct inventory lines.</div>
              </div>

              <div className="kpi">
                <div className="kpiTop">
                  <div>
                    <div className="kpiLabel">Total Units</div>
                    <div className="kpiValue">{kpis.totalQty}</div>
                  </div>
                  <div className="kpiIcon">U</div>
                </div>
                <div className="kpiHint">Sum of quantities across SKUs.</div>
              </div>

              <div className="kpi">
                <div className="kpiTop">
                  <div>
                    <div className="kpiLabel">Low Stock</div>
                    <div className="kpiValue">{kpis.lowStock}</div>
                  </div>
                  <div className="kpiIcon warn">!</div>
                </div>
                <div className="kpiHint">At/below reorder point (but not zero).</div>
              </div>

              <div className="kpi">
                <div className="kpiTop">
                  <div>
                    <div className="kpiLabel">Out of Stock</div>
                    <div className="kpiValue">{kpis.outOfStock}</div>
                  </div>
                  <div className="kpiIcon danger">×</div>
                </div>
                <div className="kpiHint">Immediate action recommended.</div>
              </div>
            </div>

            <div className="hr" />

            <div className="split">
              <div>
                <p className="sectionTitle">Inventory Value (est.)</p>
                <div className="badge">
                  <span className="badgeStrong">{valueFormatted}</span>
                  <span className="muted">based on unit price × qty</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end" }}>
                <button className="btn btnPrimary" onClick={onCreateNew}>
                  + Add item
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Inventory Preview</h2>
              <p>First 6 items</p>
            </div>
          </div>
          <div className="cardBody">
            <InventoryTable items={preview} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Alerts</h2>
              <p>Top issues to address</p>
            </div>
          </div>
          <div className="cardBody">
            <div className="alertList">
              {alerts.length ? (
                alerts.map((a) => (
                  <div key={a.id} className="alertItem">
                    <div>
                      <p className="alertTitle">{a.title}</p>
                      <p className="alertDesc">{a.description}</p>
                    </div>
                    <div className="alertMeta">
                      <span className={a.severity === "danger" ? "badge badgeDanger" : "badge badgeWarn"}>
                        <span className="badgeStrong">{a.severity === "danger" ? "Critical" : "Warning"}</span>
                      </span>
                      {a.sku ? <span className="muted">SKU: {a.sku}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <span className="muted">No alerts right now. Your stock levels look healthy.</span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div className="cardHeaderTitle">
              <h2>Workflow</h2>
              <p>Suggested operating rhythm</p>
            </div>
          </div>
          <div className="cardBody">
            <div className="btnRow">
              <span className="badge">
                <span className="badgeStrong">1</span> Scan alerts daily
              </span>
              <span className="badge">
                <span className="badgeStrong">2</span> Update reorder points
              </span>
              <span className="badge">
                <span className="badgeStrong">3</span> Receive stock and adjust qty
              </span>
            </div>
            <div className="hr" />
            <p className="muted">
              This frontend is API-ready and also works in local mode (saved in your browser) if the backend is not configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
