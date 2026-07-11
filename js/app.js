import { APP_CONFIG } from "./config.js";
import { MEAL_PRESETS } from "./meals.js";
import { loadPriceData } from "./data.js";
import { renderResults, renderSummary } from "./render.js";
import { addInventoryItem, getCheckedInventoryItems, getInventoryNames, loadInventory, saveCheckedItems } from "./inventory.js";
import { getSavedToken, saveToken, saveSharedInventory, triggerPriceWorkflow, waitForNewPrices } from "./github-actions.js";

const statusElement = document.querySelector("#status");
const summaryElement = document.querySelector("#summary");
const resultsElement = document.querySelector("#results");
const refreshButton = document.querySelector("#refreshPrices");
const inventoryList = document.querySelector("#inventoryList");
const searchInput = document.querySelector("#inventorySearch");
const selectedCount = document.querySelector("#selectedCount");
let inventory = [];

function setStatus(message) { statusElement.textContent = message; }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }

function requestToken() {
  const existing = getSavedToken();
  if (existing) return existing;
  const token = window.prompt("Paste your fine-grained GitHub token for BasketIQ. It is saved only on this phone.");
  if (!token?.trim()) throw new Error("A GitHub token is required.");
  saveToken(token);
  return token.trim();
}

function renderInventory() {
  const term = searchInput.value.trim().toLowerCase();
  const visible = inventory.filter(item => item.name.toLowerCase().includes(term));
  inventoryList.innerHTML = visible.length ? visible.map(item => `
    <label class="inventory-item">
      <input type="checkbox" data-id="${escapeHtml(item.id)}" ${item.checked ? "checked" : ""}>
      <span>${escapeHtml(item.name)}</span>
    </label>`).join("") : '<div class="inventory-empty">No matching items. Tap Add item to add this search.</div>';
  selectedCount.textContent = `${getCheckedInventoryItems(inventory).length} selected`;
}

async function refreshDisplayedPrices(data = null) {
  try {
    const latest = data || await loadPriceData();
    renderSummary(summaryElement, latest);
    renderResults(resultsElement, latest);
    setStatus(latest.updatedAt ? "Latest prices loaded." : "No price update has been run yet.");
  } catch (error) { setStatus(error.message); }
}

async function initializeInventory() {
  try {
    inventory = await loadInventory();
    renderInventory();
  } catch (error) { setStatus(error.message); }
}

inventoryList.addEventListener("change", event => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox) return;
  const item = inventory.find(entry => entry.id === checkbox.dataset.id);
  if (item) item.checked = checkbox.checked;
  saveCheckedItems(inventory);
  renderInventory();
});

searchInput.addEventListener("input", renderInventory);

document.querySelector("#addInventoryItem").addEventListener("click", () => {
  inventory = addInventoryItem(inventory, searchInput.value);
  saveCheckedItems(inventory);
  searchInput.value = "";
  renderInventory();
  setStatus("Item added locally. Tap Save inventory for both phones to share it.");
});

document.querySelector("#clearSelection").addEventListener("click", () => {
  inventory.forEach(item => { item.checked = false; });
  saveCheckedItems(inventory);
  renderInventory();
});

document.querySelector("#loadMeal").addEventListener("click", () => {
  for (const name of MEAL_PRESETS.tacoNight) {
    inventory = addInventoryItem(inventory, name);
  }
  saveCheckedItems(inventory);
  renderInventory();
  setStatus("Taco night ingredients selected.");
});

document.querySelector("#saveSharedInventory").addEventListener("click", async () => {
  try {
    setStatus("Saving shared inventory…");
    await saveSharedInventory(requestToken(), getInventoryNames(inventory));
    setStatus("Shared inventory saved. Your wife will see it after reopening or refreshing BasketIQ.");
  } catch (error) { setStatus(error.message); }
});

refreshButton.addEventListener("click", async () => {
  const items = getCheckedInventoryItems(inventory);
  if (!items.length) { setStatus("Check at least one item first."); return; }
  refreshButton.disabled = true;
  const startedAt = Date.now();
  try {
    setStatus("Starting browser scraper…");
    await triggerPriceWorkflow(requestToken(), items, APP_CONFIG.zipCode);
    const data = await waitForNewPrices(startedAt, setStatus);
    await refreshDisplayedPrices(data);
    resultsElement.scrollIntoView({ behavior: "smooth" });
  } catch (error) { setStatus(error.message); }
  finally { refreshButton.disabled = false; }
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
initializeInventory();
refreshDisplayedPrices();
