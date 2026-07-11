const CHECKED_KEY = "basketiq-checked-items-33579";

function buildInventory(names, checkedNames) {
  return names.map((name, index) => ({
    id: `item-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    checked: checkedNames.has(name.toLowerCase())
  }));
}

export async function loadInventory() {
  const checkedNames = new Set(
    JSON.parse(localStorage.getItem(CHECKED_KEY) || "[]").map(name => name.toLowerCase())
  );

  const response = await fetch(`data/inventory.json?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load shared inventory (${response.status}).`);
  const data = await response.json();
  return buildInventory(Array.isArray(data.items) ? data.items : [], checkedNames);
}

export function saveCheckedItems(items) {
  const checked = items.filter(item => item.checked).map(item => item.name);
  localStorage.setItem(CHECKED_KEY, JSON.stringify(checked));
}

export function addInventoryItem(items, name) {
  const normalized = name.trim();
  if (!normalized) return items;
  if (items.some(item => item.name.toLowerCase() === normalized.toLowerCase())) return items;

  return [
    ...items,
    {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: normalized,
      checked: true
    }
  ];
}

export function getCheckedInventoryItems(items) {
  return items.filter(item => item.checked).map(item => item.name);
}

export function getInventoryNames(items) {
  return items.map(item => item.name);
}
