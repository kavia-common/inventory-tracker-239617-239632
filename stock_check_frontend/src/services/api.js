/**
 * Minimal API client for inventory operations.
 *
 * This app supports two modes:
 * 1) API mode: Uses REACT_APP_API_BASE (or REACT_APP_BACKEND_URL) for CRUD endpoints.
 * 2) Local mode: If API is unreachable or not configured, uses localStorage.
 *
 * NOTE: Backend endpoints are not provided in this task; the API mode is implemented
 * defensively and will gracefully fall back to local mode.
 */

const LS_KEY = "inventory_items_v1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getApiBase() {
  const fromApiBase = process.env.REACT_APP_API_BASE;
  const fromBackendUrl = process.env.REACT_APP_BACKEND_URL;
  return (fromApiBase || fromBackendUrl || "").trim().replace(/\/+$/, "");
}

function readLocalItems() {
  const raw = localStorage.getItem(LS_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

function writeLocalItems(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function tryFetch(url, options) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// PUBLIC_INTERFACE
export async function getInventoryItems() {
  /** Fetch inventory items from API or localStorage fallback. */
  const apiBase = getApiBase();

  if (apiBase) {
    try {
      const res = await tryFetch(`${apiBase}/inventory`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        // If backend wraps payload:
        if (data && Array.isArray(data.items)) return data.items;
      }
      // If API responds but not ok, fall back
    } catch {
      // fall back
    }
  }

  // Local fallback (simulate network for consistent UX)
  await sleep(250);
  return readLocalItems();
}

// PUBLIC_INTERFACE
export async function createInventoryItem(item) {
  /** Create an inventory item. Expects item fields, returns created item. */
  const apiBase = getApiBase();

  if (apiBase) {
    try {
      const res = await tryFetch(`${apiBase}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) return await res.json();
    } catch {
      // fall back
    }
  }

  await sleep(200);
  const items = readLocalItems();
  const created = {
    id: newId(),
    sku: item.sku || "",
    name: item.name || "",
    category: item.category || "General",
    location: item.location || "Main",
    quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
    reorderPoint: Number.isFinite(Number(item.reorderPoint)) ? Number(item.reorderPoint) : 0,
    unitPrice: Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0,
    notes: item.notes || "",
    updatedAt: new Date().toISOString(),
  };
  writeLocalItems([created, ...items]);
  return created;
}

// PUBLIC_INTERFACE
export async function updateInventoryItem(id, patch) {
  /** Update inventory item by id. Returns updated item. */
  const apiBase = getApiBase();

  if (apiBase) {
    try {
      const res = await tryFetch(`${apiBase}/inventory/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) return await res.json();
    } catch {
      // fall back
    }
  }

  await sleep(200);
  const items = readLocalItems();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Item not found");
  const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
  const next = [...items];
  next[idx] = updated;
  writeLocalItems(next);
  return updated;
}

// PUBLIC_INTERFACE
export async function deleteInventoryItem(id) {
  /** Delete inventory item by id. Returns { ok: true }. */
  const apiBase = getApiBase();

  if (apiBase) {
    try {
      const res = await tryFetch(`${apiBase}/inventory/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) return { ok: true };
    } catch {
      // fall back
    }
  }

  await sleep(150);
  const items = readLocalItems();
  const next = items.filter((x) => x.id !== id);
  writeLocalItems(next);
  return { ok: true };
}
