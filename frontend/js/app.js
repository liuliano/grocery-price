import { APP_CONFIG } from "./config.js";

const searchInput = document.querySelector("#productSearch");
const searchButton = document.querySelector("#searchPrices");
const statusElement = document.querySelector("#status");
const resultsElement = document.querySelector("#results");
const bestResult = document.querySelector("#bestResult");
const bestPrice = document.querySelector("#bestPrice");
const bestStore = document.querySelector("#bestStore");

function money(value) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "—";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function renderResults(data, query) {
  const result = (data.results || []).find(item => item.query.toLowerCase() === query.toLowerCase()) || data.results?.[0];
  const offers = (result?.offers || []).filter(offer => Number.isFinite(offer.price)).sort((a, b) => a.price - b.price);

  if (!offers.length) {
    bestResult.hidden = true;
    resultsElement.innerHTML = '<div class="empty">No prices were captured. The retailer selectors may need adjustment.</div>';
    return;
  }

  bestResult.hidden = false;
  bestPrice.textContent = money(offers[0].price);
  bestStore.textContent = `${offers[0].store} · ${offers[0].product || query}`;

  resultsElement.innerHTML = offers.map((offer, index) => `
    <article class="result-card ${index === 0 ? "best" : ""}">
      <div>
        <div class="store">${escapeHtml(offer.store)}</div>
        <div class="product">${escapeHtml(offer.product || query)}</div>
        ${index === 0 ? '<span class="best-badge">BEST PRICE</span>' : ""}
      </div>
      <div class="result-price">${money(offer.price)}</div>
    </article>`).join("");
}

async function loadLatestResult(query, startedAt, timeoutMs = 240000) {
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    statusElement.textContent = `Searching stores… check ${attempt}`;
    await new Promise(resolve => setTimeout(resolve, 8000));

    try {
      const response = await fetch(`data/prices.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.updatedAt && new Date(data.updatedAt).getTime() >= startedAt - 5000) return data;
    } catch {}
  }

  throw new Error("The search is still running. Try again in a minute.");
}

async function searchPrices() {
  const query = searchInput.value.trim();
  if (!query) {
    statusElement.textContent = "Enter a grocery item first.";
    return;
  }

  if (!APP_CONFIG.refreshEndpoint) {
    statusElement.textContent = "The search backend is not connected yet.";
    return;
  }

  searchButton.disabled = true;
  bestResult.hidden = true;
  resultsElement.innerHTML = "";
  const startedAt = Date.now();

  try {
    statusElement.textContent = "Starting price search…";
    const response = await fetch(`${APP_CONFIG.refreshEndpoint}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [query], zipCode: APP_CONFIG.zipCode })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not start the price search.");

    const data = await loadLatestResult(query, startedAt);
    renderResults(data, query);
    statusElement.textContent = `Compared ${query} across nearby stores.`;
  } catch (error) {
    statusElement.textContent = error.message;
  } finally {
    searchButton.disabled = false;
  }
}

searchButton.addEventListener("click", searchPrices);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchPrices();
});

document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    searchPrices();
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
