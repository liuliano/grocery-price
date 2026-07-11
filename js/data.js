export async function loadPriceData() {
  const response = await fetch(`data/prices.json?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load prices (${response.status})`);
  }
  return response.json();
}
