function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function money(value) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "—";
}

export function renderSummary(container, data) {
  const offers = (data.results || []).flatMap(item => item.offers || []).filter(offer => Number.isFinite(offer.price));
  container.innerHTML = `
    <div class="summary-card"><span>Last refreshed</span><strong>${data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "Not yet"}</strong></div>
    <div class="summary-card"><span>Offers found</span><strong>${offers.length}</strong></div>`;
}

export function renderResults(container, data) {
  const results = data.results || [];
  if (!results.length) {
    container.innerHTML = '<div class="panel empty">No results yet. Run the refresh workflow, then reload this page.</div>';
    return;
  }

  container.innerHTML = results.map(item => {
    const offers = [...(item.offers || [])].sort((a, b) =>
      (a.unitPrice ?? a.price ?? Infinity) - (b.unitPrice ?? b.price ?? Infinity)
    );

    return `<article class="card">
      <h2>${escapeHtml(item.query)}</h2>
      ${offers.map((offer, index) => `
        <div class="offer">
          <div>
            <div class="store ${index === 0 ? "best" : ""}">${escapeHtml(offer.store)}${index === 0 ? " · Best value" : ""}</div>
            <div class="product">${escapeHtml(offer.product || "No matching product")}</div>
          </div>
          <div class="price">${money(offer.price)}
            <div class="unit">${offer.unitLabel ? `${money(offer.unitPrice)} ${escapeHtml(offer.unitLabel)}` : ""}</div>
          </div>
        </div>`).join("")}
    </article>`;
  }).join("");
}
