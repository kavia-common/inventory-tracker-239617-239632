/**
 * Pure utility helpers for inventory computation.
 */

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

// PUBLIC_INTERFACE
export function filterItems(items, filters) {
  /** Filter items by search query, category, location, and stock status. */
  const q = norm(filters.query);
  const category = norm(filters.category);
  const location = norm(filters.location);
  const stock = filters.stock || "all"; // all | low | out | ok

  return (items || []).filter((it) => {
    const matchesQuery =
      !q ||
      norm(it.name).includes(q) ||
      norm(it.sku).includes(q) ||
      norm(it.category).includes(q) ||
      norm(it.location).includes(q);

    const matchesCategory = !category || norm(it.category) === category;
    const matchesLocation = !location || norm(it.location) === location;

    const qty = Number(it.quantity) || 0;
    const rp = Number(it.reorderPoint) || 0;
    const isOut = qty <= 0;
    const isLow = qty > 0 && qty <= rp;
    const isOk = qty > rp;

    const matchesStock =
      stock === "all" ||
      (stock === "out" && isOut) ||
      (stock === "low" && isLow) ||
      (stock === "ok" && isOk);

    return matchesQuery && matchesCategory && matchesLocation && matchesStock;
  });
}

// PUBLIC_INTERFACE
export function computeKpis(items) {
  /** Compute summary KPI metrics for dashboard. */
  const list = items || [];
  let outOfStock = 0;
  let lowStock = 0;
  let totalQty = 0;
  let inventoryValue = 0;

  for (const it of list) {
    const qty = Number(it.quantity) || 0;
    const rp = Number(it.reorderPoint) || 0;
    const price = Number(it.unitPrice) || 0;
    totalQty += qty;
    inventoryValue += qty * price;

    if (qty <= 0) outOfStock += 1;
    else if (qty <= rp) lowStock += 1;
  }

  return {
    skuCount: list.length,
    totalQty,
    outOfStock,
    lowStock,
    inventoryValue,
  };
}

// PUBLIC_INTERFACE
export function buildAlerts(items) {
  /** Build alert objects for low/out-of-stock items. */
  const list = items || [];
  const alerts = [];

  for (const it of list) {
    const qty = Number(it.quantity) || 0;
    const rp = Number(it.reorderPoint) || 0;

    if (qty <= 0) {
      alerts.push({
        id: `out_${it.id}`,
        severity: "danger",
        title: `Out of stock: ${it.name || it.sku || "Item"}`,
        description: `Current quantity is ${qty}. Reorder point is ${rp}.`,
        sku: it.sku || "",
        itemId: it.id,
      });
    } else if (qty <= rp) {
      alerts.push({
        id: `low_${it.id}`,
        severity: "warn",
        title: `Low stock: ${it.name || it.sku || "Item"}`,
        description: `Current quantity is ${qty}. Reorder point is ${rp}.`,
        sku: it.sku || "",
        itemId: it.id,
      });
    }
  }

  // Prioritize out-of-stock then low-stock
  const sevRank = { danger: 0, warn: 1 };
  alerts.sort((a, b) => (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9));

  return alerts;
}

// PUBLIC_INTERFACE
export function uniqueValues(items, key) {
  /** Get unique normalized values for a key (category/location), preserving original casing of first encounter. */
  const map = new Map();
  for (const it of items || []) {
    const raw = String(it?.[key] || "").trim();
    if (!raw) continue;
    const k = norm(raw);
    if (!map.has(k)) map.set(k, raw);
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}
