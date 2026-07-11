import { APP_CONFIG } from "./config.js";
import { loadShoppingList, parseShoppingList, saveShoppingList } from "./storage.js";
import { MEAL_PRESETS, mergeItems } from "./meals.js";
import { loadPriceData } from "./data.js";
import { renderResults, renderSummary } from "./render.js";
import { getSavedToken, saveToken, triggerPriceWorkflow, waitForNewPrices } from "./github-actions.js";

const listElement = document.querySelector("#shoppingList");
const statusElement = document.querySelector("#status");
const summaryElement = document.querySelector("#summary");
const resultsElement = document.querySelector("#results");
const refreshButton = document.querySelector("#refreshPrices");

function setStatus(message) {
  statusElement.textContent = message;
}

function setShoppingList(items) {
  listElement.value = items.join("\n");
}

async function refreshDisplayedPrices(data = null) {
  try {
    setStatus("Loading the latest saved prices…");
    const latest = data || await loadPriceData();
    renderSummary(summaryElement, latest);
    renderResults(resultsElement, latest);
    setStatus(latest.updatedAt ? "Latest prices loaded." : "No price update has been run yet.");
  } catch (error) {
    renderSummary(summaryElement, { results: [] });
    renderResults(resultsElement, { results: [] });
    setStatus(error.message);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

function requestToken() {
  const existing = getSavedToken();
  if (existing) return existing;
  const token = window.prompt("Paste your fine-grained GitHub token for BasketIQ. It will be saved only on this phone.");
  if (!token?.trim()) throw new Error("A GitHub token is required to start the private refresh workflow.");
  saveToken(token);
  return token.trim();
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

refreshButton.addEventListener("click", async () => {
  const items = parseShoppingList(listElement.value);
  if (!items.length) {
    setStatus("Add at least one grocery item first.");
    return;
  }

  saveShoppingList(APP_CONFIG.storageKey, items);
  refreshButton.disabled = true;
  const startedAt = Date.now();

  try {
    const token = requestToken();
    setStatus("Starting browser scraper…");
    await triggerPriceWorkflow(token, items, APP_CONFIG.zipCode);
    const data = await waitForNewPrices(startedAt, setStatus);
    await refreshDisplayedPrices(data);
    document.querySelector("#results")?.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    setStatus(error.message);
  } finally {
    refreshButton.disabled = false;
  }
});

registerServiceWorker();
refreshDisplayedPrices();
