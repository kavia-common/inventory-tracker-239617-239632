import React, { useMemo, useState } from "react";
import { buildAlerts } from "../utils/inventory";
import { Modal } from "../components/ui/Modal";
import { InventoryForm } from "../components/inventory/InventoryForm";

// PUBLIC_INTERFACE
export function AlertsPage({ items, onUpdate }) {
  /** Render alert list and allow quick edits (e.g., update reorder/quantity). */
  const alerts = useMemo(() => buildAlerts(items), [items]);
  const [editItem, setEditItem] = useState(null);

  const itemById = useMemo(() => {
    const m = new Map();
    for (const it of items || []) m.set(it.id, it);
    return m;
  }, [items]);

  const selected = editItem ? itemById.get(editItem) : null;

  return (
    <div className="twoCol">
      <div className="card">
        <div className="cardHeader">
          <div className="cardHeaderTitle">
            <h2>Alerts</h2>
            <p>{alerts.length} active</p>
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
                    <div className="btnRow" style={{ marginTop: 10 }}>
                      <button className="btn btnSmall btnPrimary" onClick={() => setEditItem(a.itemId)}>
                        Quick edit
                      </button>
                    </div>
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
              <span className="muted">No alerts. Consider lowering reorder points if you want earlier warnings.</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div className="cardHeaderTitle">
            <h2>What triggers alerts?</h2>
            <p>Rules of thumb</p>
          </div>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Alerts are generated based on quantity vs reorder point:
          </p>
          <div className="btnRow">
            <span className="badge badgeDanger">
              <span className="badgeStrong">Out</span> qty ≤ 0
            </span>
            <span className="badge badgeWarn">
              <span className="badgeStrong">Low</span> 0 &lt; qty ≤ reorder
            </span>
            <span className="badge">
              <span className="badgeStrong">OK</span> qty &gt; reorder
            </span>
          </div>
        </div>
      </div>

      {selected ? (
        <Modal
          title={`Quick edit: ${selected.name || selected.sku || "Item"}`}
          onClose={() => setEditItem(null)}
          footer={
            <div className="btnRow">
              <button className="btn" onClick={() => setEditItem(null)}>
                Done
              </button>
            </div>
          }
        >
          <InventoryForm
            initialValue={selected}
            submitLabel="Save changes"
            onSubmit={(payload) => onUpdate?.(selected.id, payload)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
