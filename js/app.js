import { APP_CONFIG } from "./config.js";
import { loadShoppingList, parseShoppingList, saveShoppingList } from "./storage.js";
import { MEAL_PRESETS, mergeItems } from "./meals.js";
import { loadPriceData } from "./data.js";
import { renderResults, renderSummary } from "./render.js";

const listElement = document.querySelector("#shoppingList");
const statusElement = document.querySelector("#status");
const summaryElement = document.querySelector("#summary");
const resultsElement = document.querySelector("#results");

function setStatus(message) {
  statusElement.textContent = message;
}

function setShoppingList(items) {
  listElement.value = items.join("\n");
}

async function refreshDisplayedPrices() {
  try {
    setStatus("Loading the latest saved prices…");
    const data = await loadPriceData();
    renderSummary(summaryElement, data);
    renderResults(resultsElement, data);
    setStatus(data.updatedAt ? "Latest saved prices loaded." : "No scrape has been run yet.");
  } catch (error) {
    renderSummary(summaryElement, { results: [] });
    renderResults(resultsElement, { results: [] });
    setStatus(error.message);
  }
}

setShoppingList(loadShoppingList(APP_CONFIG.storageKey, APP_CONFIG.defaultItems));

document.querySelector("#saveList").addEventListener("click", () => {
  const items = parseShoppingList(listElement.value);
  saveShoppingList(APP_CONFIG.storageKey, items);
  setStatus("Shopping list saved on this phone.");
});

document.querySelector("#loadMeal").addEventListener("click", () => {
  const currentItems = parseShoppingList(listElement.value);
  const mergedItems = mergeItems(currentItems, MEAL_PRESETS.tacoNight);
  setShoppingList(mergedItems);
  saveShoppingList(APP_CONFIG.storageKey, mergedItems);
  setStatus("Taco night ingredients added.");
});

document.querySelector("#refreshPrices").addEventListener("click", () => {
  saveShoppingList(APP_CONFIG.storageKey, parseShoppingList(listElement.value));
  window.open(APP_CONFIG.workflowUrl, "_blank", "noopener,noreferrer");
  setStatus("Run the GitHub workflow, then return here and reload the page.");
});

refreshDisplayedPrices();
