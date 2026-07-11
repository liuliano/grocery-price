const TOKEN_KEY = "basketiq-github-token";
const API_ROOT = "https://api.github.com/repos/liuliano/grocery-price";
const WORKFLOW_FILE = "refresh-prices.yml";

function headers(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

export function getSavedToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function triggerPriceWorkflow(token, items, zipCode) {
  const response = await fetch(`${API_ROOT}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      ref: "main",
      inputs: {
        shopping_list: JSON.stringify(items),
        zip_code: zipCode
      }
    })
  });

  if (response.status === 204) return;

  let message = `GitHub rejected the refresh (${response.status}).`;
  try {
    const body = await response.json();
    if (body.message) message = body.message;
  } catch {}
  throw new Error(message);
}

export async function waitForNewPrices(startedAt, onProgress, timeoutMs = 240000) {
  const started = Date.now();
  let attempts = 0;

  while (Date.now() - started < timeoutMs) {
    attempts += 1;
    onProgress?.(`Price update running… check ${attempts}`);
    await new Promise(resolve => setTimeout(resolve, 8000));

    try {
      const response = await fetch(`data/prices.json?refresh=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.updatedAt && new Date(data.updatedAt).getTime() >= startedAt - 5000) {
        return data;
      }
    } catch {}
  }

  throw new Error("The price update is still running. Try Reload latest prices in a minute.");
}
