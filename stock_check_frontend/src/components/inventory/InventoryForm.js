import React, { useMemo, useState } from "react";

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// PUBLIC_INTERFACE
export function InventoryForm({ initialValue, onSubmit, submitLabel }) {
  /** Inventory item form with validation and normalized output. */
  const initial = useMemo(() => {
    return {
      sku: initialValue?.sku || "",
      name: initialValue?.name || "",
      category: initialValue?.category || "General",
      location: initialValue?.location || "Main",
      quantity: initialValue?.quantity ?? 0,
      reorderPoint: initialValue?.reorderPoint ?? 0,
      unitPrice: initialValue?.unitPrice ?? 0,
      notes: initialValue?.notes || "",
    };
  }, [initialValue]);

  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  function setField(k, v) {
    setValue((prev) => ({ ...prev, [k]: v }));
  }

  function validate() {
    if (!value.sku.trim() && !value.name.trim()) return "Please provide at least a SKU or a Name.";
    if (asNumber(value.quantity) < 0) return "Quantity cannot be negative.";
    if (asNumber(value.reorderPoint) < 0) return "Reorder point cannot be negative.";
    if (asNumber(value.unitPrice) < 0) return "Unit price cannot be negative.";
    return "";
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const msg = validate();
        if (msg) {
          setError(msg);
          return;
        }
        setError("");
        onSubmit?.({
          sku: value.sku.trim(),
          name: value.name.trim(),
          category: value.category.trim() || "General",
          location: value.location.trim() || "Main",
          quantity: asNumber(value.quantity),
          reorderPoint: asNumber(value.reorderPoint),
          unitPrice: asNumber(value.unitPrice),
          notes: value.notes.trim(),
        });
      }}
    >
      {error ? (
        <div className="badge badgeDanger" style={{ marginBottom: 12 }}>
          <span className="badgeStrong">Fix:</span> {error}
        </div>
      ) : null}

      <div className="row">
        <div className="field">
          <label htmlFor="sku">SKU</label>
          <input id="sku" className="input" value={value.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="e.g. ACME-001" />
        </div>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" value={value.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Premium Coffee Beans" />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="category">Category</label>
          <input id="category" className="input" value={value.category} onChange={(e) => setField("category", e.target.value)} placeholder="General" />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input id="location" className="input" value={value.location} onChange={(e) => setField("location", e.target.value)} placeholder="Main" />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" className="input" type="number" value={value.quantity} onChange={(e) => setField("quantity", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="reorderPoint">Reorder point</label>
          <input id="reorderPoint" className="input" type="number" value={value.reorderPoint} onChange={(e) => setField("reorderPoint", e.target.value)} />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="unitPrice">Unit price</label>
          <input id="unitPrice" className="input" type="number" step="0.01" value={value.unitPrice} onChange={(e) => setField("unitPrice", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="notes">Notes</label>
          <input id="notes" className="input" value={value.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="btnRow" style={{ justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn btnPrimary" type="submit">
          {submitLabel || "Save"}
        </button>
      </div>
    </form>
  );
}
