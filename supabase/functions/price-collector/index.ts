import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type TickPayload = {
  provider_ts: string;
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  source: "TD_LIVE" | "TD_DELAYED";
  is_delayed: boolean;
  meta: Record<string, unknown>;
};

const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
// Edge Function custom secrets cannot start with SUPABASE_.
// Use PROJECT_URL + SERVICE_ROLE_KEY for dashboard secrets.
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PRICE_COLLECTOR_CRON_SECRET = Deno.env.get("PRICE_COLLECTOR_CRON_SECRET") ?? "";
const SYMBOL = Deno.env.get("TWELVE_SYMBOL") ?? "XAU/USD";
const TWELVE_BASE_URL = "https://api.twelvedata.com";
const MARKET_REOPEN_SUNDAY_UTC_HOUR = 22;
const MARKET_CLOSE_FRIDAY_UTC_HOUR = 22;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseFloatSafe(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseProviderTs(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    if (/^\d+$/.test(value.trim())) {
      const n = Number(value.trim());
      if (Number.isFinite(n)) return new Date(n * 1000).toISOString();
    }
    const text = value.trim().replace(" ", "T");
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function clampToRecent(isoTs: string, maxAgeMinutes = 30): string {
  const ts = new Date(isoTs).getTime();
  const now = Date.now();
  if (!Number.isFinite(ts)) return new Date().toISOString();
  const ageMin = Math.abs(now - ts) / 60000;
  return ageMin > maxAgeMinutes ? new Date().toISOString() : new Date(ts).toISOString();
}

function getMarketClockContext(now = new Date()) {
  const weekday = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const reopenMinutes = MARKET_REOPEN_SUNDAY_UTC_HOUR * 60;
  const fridayCloseMinutes = MARKET_CLOSE_FRIDAY_UTC_HOUR * 60;

  let marketOpen = true;
  let reason = "OPEN";
  if (weekday === 6) {
    marketOpen = false;
    reason = "SATURDAY_CLOSED";
  } else if (weekday === 0 && totalMinutes < reopenMinutes) {
    marketOpen = false;
    reason = "SUNDAY_PREOPEN";
  } else if (weekday === 5 && totalMinutes >= fridayCloseMinutes) {
    marketOpen = false;
    reason = "FRIDAY_AFTER_CLOSE";
  }

  return {
    marketOpen,
    reason,
    weekday,
    utcHour: now.getUTCHours(),
    utcMinute: now.getUTCMinutes(),
  };
}

async function twelveGet(path: string, params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const u = new URL(`${TWELVE_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("apikey", TWELVE_DATA_API_KEY);

  try {
    const resp = await fetch(u, { method: "GET" });
    if (!resp.ok) {
      console.error(`TwelveData ${path} HTTP ${resp.status}`);
      return null;
    }
    const data = (await resp.json()) as Record<string, unknown>;
    if (String(data.status ?? "").toLowerCase() === "error") {
      console.error(`TwelveData ${path} error:`, data.message ?? "unknown");
      return null;
    }
    return data;
  } catch (err) {
    console.error(`TwelveData ${path} request failed:`, err);
    return null;
  }
}

async function fetchTick(): Promise<TickPayload | null> {
  const quote = await twelveGet("/quote", { symbol: SYMBOL });
  if (quote) {
    const price = parseFloatSafe(quote.close ?? quote.price ?? quote.last);
    const bid = parseFloatSafe(quote.bid);
    const ask = parseFloatSafe(quote.ask);
    if (price) {
      const providerTs = clampToRecent(parseProviderTs(quote.timestamp ?? quote.datetime));
      return {
        provider_ts: providerTs,
        symbol: SYMBOL,
        price,
        bid: bid ?? price,
        ask: ask ?? price,
        source: "TD_LIVE",
        is_delayed: false,
        meta: {
          endpoint: "quote",
          quote_datetime: quote.datetime ?? null,
          quote_timestamp: quote.timestamp ?? null,
        },
      };
    }
  }

  const priceResp = await twelveGet("/price", { symbol: SYMBOL });
  if (priceResp) {
    const price = parseFloatSafe(priceResp.price);
    if (price) {
      return {
        provider_ts: new Date().toISOString(),
        symbol: SYMBOL,
        price,
        bid: price,
        ask: price,
        source: "TD_DELAYED",
        is_delayed: true,
        meta: { endpoint: "price" },
      };
    }
  }

  const series = await twelveGet("/time_series", {
    symbol: SYMBOL,
    interval: "1min",
    outputsize: "1",
    order: "DESC",
    timezone: "UTC",
  });
  const rawValues = series?.["values"];
  const values = Array.isArray(rawValues) ? (rawValues as Array<Record<string, unknown>>) : [];
  if (values.length > 0) {
    const row = values[0];
    const close = parseFloatSafe(row.close);
    if (close) {
      return {
        provider_ts: parseProviderTs(row.datetime),
        symbol: SYMBOL,
        price: close,
        bid: close,
        ask: close,
        source: "TD_DELAYED",
        is_delayed: true,
        meta: { endpoint: "time_series_1m" },
      };
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!TWELVE_DATA_API_KEY || !PROJECT_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing required edge function secrets" }, 500);
  }

  // Optional shared-secret guard for scheduler calls.
  // If PRICE_COLLECTOR_CRON_SECRET is not configured, the endpoint remains callable
  // only by URL knowledge and should be rotated to a guarded mode later.
  if (PRICE_COLLECTOR_CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret") ?? "";
    if (!secret || secret !== PRICE_COLLECTOR_CRON_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  const marketClock = getMarketClockContext();
  if (!marketClock.marketOpen) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "MARKET_CLOSED",
      market_reason: marketClock.reason,
      market_clock: {
        weekday: marketClock.weekday,
        utc_hour: marketClock.utcHour,
        utc_minute: marketClock.utcMinute,
      },
    });
  }

  const tick = await fetchTick();
  if (!tick) {
    return jsonResponse({ error: "No market tick fetched" }, 502);
  }

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
  const payload = {
    provider_ts: tick.provider_ts,
    symbol: tick.symbol,
    price: Number(tick.price.toFixed(5)),
    bid: Number(tick.bid.toFixed(5)),
    ask: Number(tick.ask.toFixed(5)),
    source: tick.source,
    is_delayed: tick.is_delayed,
    meta: tick.meta,
  };

  const { error } = await supabase.from("market_ticks").insert(payload);
  if (error) {
    console.error("Supabase insert error:", error.message);
    return jsonResponse({ error: "Failed to write market tick", details: error.message }, 500);
  }

  return jsonResponse({
    ok: true,
    inserted: {
      symbol: payload.symbol,
      price: payload.price,
      source: payload.source,
      provider_ts: payload.provider_ts,
    },
  });
});
