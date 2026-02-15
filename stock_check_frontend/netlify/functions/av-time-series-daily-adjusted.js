/**
 * Netlify Function: Alpha Vantage proxy (TIME_SERIES_DAILY_ADJUSTED) with caching.
 *
 * Why:
 * - Keep ALPHA_VANTAGE_API_KEY secret (never exposed to the browser).
 * - Add caching to mitigate Alpha Vantage rate limits.
 *
 * Endpoint:
 *   GET /.netlify/functions/av-time-series-daily-adjusted?symbol=MSFT&outputsize=compact|full
 *
 * Notes:
 * - Uses in-memory cache per warm function instance. This improves burst behavior but is not a
 *   durable cache across cold starts/regions (still helpful for typical Netlify usage).
 */

const AV_BASE = "https://www.alphavantage.co/query";

/**
 * In-memory cache structure:
 * key -> { expiresAtMs: number, statusCode: number, body: string, headers: object }
 */
const CACHE = new Map();

const DEFAULT_TTL_SECONDS = 60; // keep short by default; overrideable via env

function jsonResponse(statusCode, obj, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(obj),
  };
}

function getTtlSeconds(outputsize) {
  // Keep "full" responses cached longer, since they are large and expensive.
  const envDefault = Number.parseInt(process.env.ALPHA_VANTAGE_CACHE_TTL_SECONDS || "", 10);
  const base = Number.isFinite(envDefault) && envDefault > 0 ? envDefault : DEFAULT_TTL_SECONDS;

  if (outputsize === "full") return Math.max(base, 60 * 60 * 6); // 6 hours
  return Math.max(base, 60 * 5); // 5 minutes minimum for compact
}

function cacheKey({ symbol, outputsize }) {
  return `ts_daily_adjusted:${String(symbol).toUpperCase()}:${outputsize}`;
}

function nowMs() {
  return Date.now();
}

async function fetchAlphaVantage({ apiKey, symbol, outputsize }) {
  const url =
    `${AV_BASE}?function=TIME_SERIES_DAILY_ADJUSTED` +
    `&symbol=${encodeURIComponent(symbol)}` +
    `&outputsize=${encodeURIComponent(outputsize)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
    },
  });

  const text = await res.text();

  // AlphaVantage returns JSON in most cases, but sometimes can return HTML/plaintext on errors.
  // We forward the text; frontend will parse JSON and throw explicit errors if it's not JSON.
  return {
    status: res.status,
    body: text,
    contentType: res.headers.get("content-type") || "application/json; charset=utf-8",
  };
}

// PUBLIC_INTERFACE
export async function handler(event) {
  /** Netlify Function handler for Alpha Vantage TIME_SERIES_DAILY_ADJUSTED proxy with caching. */
  try {
    if (event.httpMethod !== "GET") {
      return jsonResponse(405, { error: "Method not allowed" }, { allow: "GET" });
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return jsonResponse(500, {
        error:
          "Server is not configured. Missing ALPHA_VANTAGE_API_KEY env var in Netlify site settings.",
      });
    }

    const symbol = event.queryStringParameters?.symbol;
    const outputsizeRaw = event.queryStringParameters?.outputsize || "compact";
    const outputsize = outputsizeRaw === "full" ? "full" : "compact";

    if (!symbol || typeof symbol !== "string") {
      return jsonResponse(400, { error: "Missing required query param: symbol" });
    }

    const ttlSeconds = getTtlSeconds(outputsize);
    const key = cacheKey({ symbol, outputsize });

    const cached = CACHE.get(key);
    if (cached && cached.expiresAtMs > nowMs()) {
      return {
        statusCode: cached.statusCode,
        headers: {
          ...cached.headers,
          "content-type": cached.headers["content-type"] || "application/json; charset=utf-8",
          "x-cache": "HIT",
          "x-cache-ttl": String(ttlSeconds),
        },
        body: cached.body,
      };
    }

    const upstream = await fetchAlphaVantage({ apiKey, symbol, outputsize });

    // Cache only successful (200) responses. Alpha Vantage rate limit errors often come as 200 too,
    // but we still cache them briefly to avoid hammering.
    const expiresAtMs = nowMs() + ttlSeconds * 1000;

    const headers = {
      "content-type": upstream.contentType,
      // Allow browsers to call this function from the same origin.
      // (Netlify serves functions from the same site domain.)
      "access-control-allow-origin": "*",
      "x-cache": "MISS",
      "x-cache-ttl": String(ttlSeconds),
    };

    const statusCode = upstream.status || 200;
    const body = upstream.body;

    CACHE.set(key, { expiresAtMs, statusCode, body, headers });

    return { statusCode, headers, body };
  } catch (e) {
    return jsonResponse(500, { error: e?.message || String(e) });
  }
}
