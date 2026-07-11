const ALLOWED_ORIGINS = new Set([
  "https://liuliano.github.io"
]);

const GITHUB_API = "https://api.github.com/repos/liuliano/grocery-price";

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://liuliano.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function githubHeaders(token) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "BasketIQ-Refresh-Worker"
  };
}

async function resolveGitHubToken(env) {
  const binding = env.GITHUB_TOKEN;

  if (typeof binding === "string" && binding.trim()) {
    return binding.trim();
  }

  if (binding && typeof binding.get === "function") {
    const value = await binding.get();
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function triggerRefresh(request, env, origin) {
  const body = await request.json().catch(() => null);
  const items = body?.items;
  const zipCode = String(body?.zipCode || "33579");

  if (!Array.isArray(items) || items.length < 1 || items.length > 40) {
    return json({ error: "Select between 1 and 40 items." }, 400, origin);
  }

  const cleanItems = items
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, 40);

  if (!cleanItems.length) {
    return json({ error: "No valid items were supplied." }, 400, origin);
  }

  const githubToken = await resolveGitHubToken(env);
  if (!githubToken) {
    return json({ error: "The Worker cannot read its GITHUB_TOKEN runtime binding." }, 500, origin);
  }

  const response = await fetch(`${GITHUB_API}/dispatches`, {
    method: "POST",
    headers: githubHeaders(githubToken),
    body: JSON.stringify({
      event_type: "basketiq-price-search",
      client_payload: {
        shopping_list: cleanItems,
        zip_code: zipCode
      }
    })
  });

  if (response.status !== 204) {
    const detail = await response.text();
    return json({
      error: "GitHub could not start the price refresh.",
      githubStatus: response.status,
      detail
    }, 502, origin);
  }

  return json({ ok: true, message: "Price refresh started." }, 202, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin not allowed." }, 403, origin);
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/refresh") {
      return triggerRefresh(request, env, origin);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "BasketIQ refresh worker" }, 200, origin);
    }

    return json({ error: "Not found." }, 404, origin);
  }
};
