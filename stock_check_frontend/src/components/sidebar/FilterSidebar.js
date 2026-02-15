import React from "react";

// PUBLIC_INTERFACE
export function FilterSidebar({ filters, categories, locations, onChange, onReset }) {
  /** Render a sidebar with search and filter options. */
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardHeaderTitle">
          <h2>Search & Filter</h2>
          <p>Refine inventory</p>
        </div>
      </div>
      <div className="cardBody">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            className="input"
            value={filters.query}
            onChange={(e) => onChange?.({ ...filters, query: e.target.value })}
            placeholder="Name, SKU, category..."
          />
        </div>

        <div className="field">
          <label htmlFor="cat">Category</label>
          <select
            id="cat"
            className="select"
            value={filters.category}
            onChange={(e) => onChange?.({ ...filters, category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="loc">Location</label>
          <select
            id="loc"
            className="select"
            value={filters.location}
            onChange={(e) => onChange?.({ ...filters, location: e.target.value })}
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="stock">Stock status</label>
          <select
            id="stock"
            className="select"
            value={filters.stock}
            onChange={(e) => onChange?.({ ...filters, stock: e.target.value })}
          >
            <option value="all">All</option>
            <option value="ok">Healthy</option>
            <option value="low">Low</option>
            <option value="out">Out</option>
          </select>
        </div>

        <div className="btnRow" style={{ justifyContent: "space-between" }}>
          <button className="btn" type="button" onClick={onReset}>
            Reset
          </button>
          <span className="muted">Tip: filters apply instantly.</span>
        </div>
      </div>
    </div>
  );
}
