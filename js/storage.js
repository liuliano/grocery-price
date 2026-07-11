export function loadShoppingList(storageKey, fallbackItems) {
  const saved = localStorage.getItem(storageKey);
  return saved ? saved.split("\n").map(item => item.trim()).filter(Boolean) : fallbackItems;
}

export function saveShoppingList(storageKey, items) {
  localStorage.setItem(storageKey, items.join("\n"));
}

export function parseShoppingList(value) {
  return value.split("\n").map(item => item.trim()).filter(Boolean);
}
