const INVENTORY_KEY = "basketiq-inventory-33579";

const DEFAULT_INVENTORY = [
  "whole milk 1 gallon",
  "large eggs 12 count",
  "boneless chicken breast",
  "ground beef 1 pound",
  "sandwich bread",
  "bananas",
  "apples",
  "shredded cheddar cheese 8 ounce",
  "sliced cheddar cheese",
  "mozzarella cheese 8 ounce",
  "cream cheese 8 ounce",
  "yogurt",
  "butter",
  "rice",
  "pasta",
  "tomato sauce",
  "coffee",
  "bottled water"
];

export function loadInventory() {
  try {
    const saved = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}

  return DEFAULT_INVENTORY.map((name, index) => ({
    id: `default-${index}`,
    name,
    checked: false
  }));
}

export function saveInventory(items) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
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
