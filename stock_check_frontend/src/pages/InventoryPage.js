import React, { useMemo, useState } from "react";
import { FilterSidebar } from "../components/sidebar/FilterSidebar";
import { InventoryTable } from "../components/inventory/InventoryTable";
import { Modal } from "../components/ui/Modal";
import { InventoryForm } from "../components/inventory/InventoryForm";
import { filterItems, uniqueValues } from "../utils/inventory";

// PUBLIC_INTERFACE
export function InventoryPage({ items, onCreate, onUpdate, onDelete }) {
  /** Inventory management view with filters and CRUD actions. */
  const [filters, setFilters] = useState({ query: "", category: "", location: "", stock: "all" });
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', item? }
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => uniqueValues(items, "category"), [items]);
  const locations = useMemo(() => uniqueValues(items, "location"), [items]);

  const filtered = useMemo(() => filterItems(items, filters), [items, filters]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      await onCreate?.(payload);
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(itemId, payload) {
    setBusy(true);
    try {
      await onUpdate?.(itemId, payload);
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="twoCol">
      <FilterSidebar
        filters={filters}
        categories={categories}
        locations={locations}
        onChange={setFilters}
        onReset={() => setFilters({ query: "", category: "", location: "", stock: "all" })}
      />

      <div className="card">
        <div className="cardHeader">
          <div className="cardHeaderTitle">
            <h2>Inventory</h2>
            <p>{filtered.length} match(es)</p>
          </div>
        </div>
        <div className="cardBody">
          <div className="btnRow" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <button className="btn btnPrimary" onClick={() => setModal({ mode: "create" })}>
              + New item
            </button>
            <span className="muted">Tip: use the sidebar to search and filter.</span>
          </div>

          <InventoryTable
            items={filtered}
            onEdit={(it) => setModal({ mode: "edit", item: it })}
            onDelete={onDelete}
          />
        </div>
      </div>

      {modal ? (
        <Modal
          title={modal.mode === "create" ? "Create inventory item" : "Edit inventory item"}
          onClose={() => (busy ? null : setModal(null))}
          footer={
            <div className="btnRow">
              <button className="btn" onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          }
        >
          <InventoryForm
            initialValue={modal.item}
            submitLabel={busy ? "Saving..." : "Save"}
            onSubmit={(payload) => {
              if (modal.mode === "create") return handleCreate(payload);
              return handleUpdate(modal.item.id, payload);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
