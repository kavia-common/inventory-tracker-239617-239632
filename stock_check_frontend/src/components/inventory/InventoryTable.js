import React from "react";

function stockBadge(item) {
  const qty = Number(item.quantity) || 0;
  const rp = Number(item.reorderPoint) || 0;
  if (qty <= 0) return { className: "badge badgeDanger", label: "Out" };
  if (qty <= rp) return { className: "badge badgeWarn", label: "Low" };
  return { className: "badge", label: "OK" };
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// PUBLIC_INTERFACE
export function InventoryTable({ items, onEdit, onDelete }) {
  /** Render an inventory table with edit/delete actions. */
  return (
    <div className="tableWrap" role="region" aria-label="Inventory table">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 140 }}>SKU</th>
            <th>Name</th>
            <th style={{ width: 150 }}>Category</th>
            <th style={{ width: 140 }}>Location</th>
            <th style={{ width: 120 }}>Stock</th>
            <th style={{ width: 120 }}>Reorder</th>
            <th style={{ width: 140 }}>Unit price</th>
            <th style={{ width: 170, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((it) => {
            const b = stockBadge(it);
            return (
              <tr key={it.id}>
                <td style={{ fontWeight: 800 }}>{it.sku || <span className="muted">—</span>}</td>
                <td>{it.name || <span className="muted">Unnamed</span>}</td>
                <td>{it.category || <span className="muted">—</span>}</td>
                <td>{it.location || <span className="muted">—</span>}</td>
                <td>
                  <span className={b.className}>
                    <span className="badgeStrong">{b.label}</span> {Number(it.quantity) || 0}
                  </span>
                </td>
                <td>{Number(it.reorderPoint) || 0}</td>
                <td>{money(it.unitPrice)}</td>
                <td>
                  <div className="tableActions">
                    <button className="btn btnSmall" onClick={() => onEdit?.(it)}>
                      Edit
                    </button>
                    <button className="btn btnSmall btnDanger" onClick={() => onDelete?.(it)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!items || items.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: 16 }}>
                <span className="muted">No items match your current filters.</span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
