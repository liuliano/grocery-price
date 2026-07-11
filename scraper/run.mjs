import fs from "node:fs/promises";
import { chromium } from "playwright";
import { RETAILERS } from "./retailers.js";
import { extractFirstOffer } from "./extract.js";

const zipCode = process.env.ZIP_CODE || "33579";
let items;
try {
  items = JSON.parse(process.env.SHOPPING_LIST || "[]");
} catch {
  throw new Error("SHOPPING_LIST must be valid JSON.");
}

if (!Array.isArray(items) || !items.length) {
  throw new Error("Shopping list is empty.");
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: "en-US",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
  viewport: { width: 1365, height: 900 }
});

const results = [];

for (const query of items.slice(0, 40)) {
  const offers = [];

  for (const retailer of RETAILERS) {
    const page = await context.newPage();
    try {
      await page.goto(retailer.searchUrl(query, zipCode), {
        waitUntil: "domcontentloaded",
        timeout: 45000
      });
      await page.waitForTimeout(3500);
      const offer = await extractFirstOffer(page, retailer.name, query);
      offers.push(offer);
      console.log(`Found ${retailer.name}: ${query} - $${offer.price}`);
    } catch (error) {
      console.warn(`${retailer.name} failed for ${query}: ${error.message}`);
      offers.push({
        store: retailer.name,
        product: "No result captured",
        price: null,
        unitPrice: null,
        unitLabel: "",
        available: false,
        error: error.message
      });
    } finally {
      await page.close();
    }
  }

  results.push({ query, offers });
}

await browser.close();

const output = {
  updatedAt: new Date().toISOString(),
  zipCode,
  source: "browser-scrape-poc",
  results
};

await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/prices.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Saved ${results.length} item comparisons to data/prices.json`);
