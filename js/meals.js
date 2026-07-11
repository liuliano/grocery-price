export const MEAL_PRESETS = {
  tacoNight: [
    "ground beef 1 pound",
    "taco shells 12 count",
    "shredded cheddar cheese 8 ounce",
    "lettuce 1 head",
    "tomatoes 2 count",
    "sour cream 16 ounce",
    "taco seasoning 1 packet"
  ]
};

export function mergeItems(currentItems, newItems) {
  return [...new Set([...currentItems, ...newItems])];
}
