function parsePrice(value) {
  if (typeof value === "number") return value;
  const match = String(value || "").replace(/,/g, "").match(/\$?([0-9]+(?:\.[0-9]{1,2})?)/);
  return match ? Number(match[1]) : null;
}

function flattenJsonLd(value, output = []) {
  if (!value) return output;
  if (Array.isArray(value)) {
    value.forEach(item => flattenJsonLd(item, output));
    return output;
  }
  if (typeof value === "object") {
    output.push(value);
    Object.values(value).forEach(item => {
      if (typeof item === "object") flattenJsonLd(item, output);
    });
  }
  return output;
}

export async function extractFirstOffer(page, retailerName, query) {
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents().catch(() => []);

  for (const raw of jsonLd) {
    try {
      const objects = flattenJsonLd(JSON.parse(raw));
      for (const object of objects) {
        const type = Array.isArray(object["@type"]) ? object["@type"] : [object["@type"]];
        if (!type.includes("Product")) continue;
        const offer = Array.isArray(object.offers) ? object.offers[0] : object.offers;
        const price = parsePrice(offer?.price ?? offer?.lowPrice ?? object.price);
        if (!price) continue;
        return {
          store: retailerName,
          product: object.name || query,
          price,
          unitPrice: null,
          unitLabel: "",
          url: object.url || page.url(),
          available: !String(offer?.availability || "").toLowerCase().includes("outofstock")
        };
      }
    } catch {}
  }

  const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
  const lines = bodyText.split("\n").map(line => line.trim()).filter(Boolean);
  const priceIndex = lines.findIndex(line => /^\$\d+(?:\.\d{2})?$/.test(line));
  if (priceIndex >= 0) {
    const product = lines.slice(Math.max(0, priceIndex - 4), priceIndex).reverse().find(line => line.length > 3 && !/^\$/.test(line)) || query;
    return {
      store: retailerName,
      product,
      price: parsePrice(lines[priceIndex]),
      unitPrice: null,
      unitLabel: "",
      url: page.url(),
      available: true
    };
  }

  throw new Error(`No product price found for ${query}`);
}
