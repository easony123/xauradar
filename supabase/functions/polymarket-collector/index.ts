import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type BtcTick = {
  provider_ts: string;
  symbol: string;
  price: number;
  change_24h: number | null;
  source: "COINGECKO";
  meta: Record<string, unknown>;
};

type PolymarketRow = {
  market_slug: string;
  provider_ts: string;
  title: string;
  category: string;
  probability: number;
  yes_price: number | null;
  no_price: number | null;
  volume: number | null;
  liquidity: number | null;
  status: string;
  end_date: string | null;
  source: "POLYMARKET";
  meta: Record<string, unknown>;
};

const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const POLYMARKET_COLLECTOR_CRON_SECRET = Deno.env.get("POLYMARKET_COLLECTOR_CRON_SECRET") ?? "";
const COINGECKO_API_KEY = Deno.env.get("COINGECKO_API_KEY") ?? "";
const POLYMARKET_BASE_URL = Deno.env.get("POLYMARKET_BASE_URL") ?? "https://gamma-api.polymarket.com";
const ALLOWED_POLY_CATEGORIES = new Set([
  "trending",
  "breaking",
  "new",
  "politics",
  "finance",
  "geopolitics",
  "oil",
  "xauusd",
]);

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseNum(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  const text = String(value).trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseMaybeArray(value: unknown): Array<unknown> {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeProbability(raw: unknown, fallbackPrice: number | null): number | null {
  const n = parseNum(raw);
  if (n !== null) {
    if (n >= 0 && n <= 1) return n * 100;
    if (n >= 0 && n <= 100) return n;
  }
  return fallbackPrice !== null ? fallbackPrice * 100 : null;
}

function classifyCategory(text: string): string {
  const t = text.toLowerCase();
  if (/\b(trending|trend)\b/.test(t)) return "trending";
  if (/\b(breaking|headline|urgent)\b/.test(t)) return "breaking";
  if (/\b(new|latest|fresh)\b/.test(t)) return "new";
  if (/\b(gold|xau|xauusd|bullion|precious metal)\b/.test(t)) return "xauusd";
  if (/\b(oil|brent|wti|crude|opec|energy)\b/.test(t)) return "oil";
  if (/\b(politics|election|president|senate|congress|minister|government|white house|parliament|trump|biden)\b/.test(t)) return "politics";
  if (/\b(war|ukraine|russia|israel|gaza|taiwan|geopolitic|missile|sanction|ceasefire|conflict|putin|xi jinping|iran|nato|military)\b/.test(t)) return "geopolitics";
  if (/\b(finance|financial|fomc|fed|powell|rate cut|rate hike|interest rate|us rates|cpi|pce|nfp|inflation|gdp|economy|tariff|yield|stocks|nasdaq|dow|s&p|bond|dollar|usd)\b/.test(t)) return "finance";
  return "other";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120) || "market";
}

async function fetchBtcTick(): Promise<BtcTick | null> {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", "bitcoin");
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_last_updated_at", "true");

  const headers: HeadersInit = {};
  if (COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
  }

  try {
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      console.error("CoinGecko HTTP error:", resp.status);
      return null;
    }
    const data = (await resp.json()) as Record<string, Record<string, unknown>>;
    const btc = data.bitcoin;
    if (!btc) return null;

    const price = parseNum(btc.usd);
    if (price === null) return null;
    const change = parseNum(btc.usd_24h_change);
    const ts = toIso(btc.last_updated_at) ?? new Date().toISOString();

    return {
      provider_ts: ts,
      symbol: "BTC/USD",
      price,
      change_24h: change,
      source: "COINGECKO",
      meta: {
        endpoint: "simple/price",
      },
    };
  } catch (err) {
    console.error("CoinGecko request failed:", err);
    return null;
  }
}

function normalizePolymarketRow(row: Record<string, unknown>): PolymarketRow | null {
  const title = String(row.question ?? row.title ?? row.name ?? "").trim();
  if (!title) return null;

  const yesPriceDirect = parseNum(row.yes_price ?? row.yesPrice);
  const noPriceDirect = parseNum(row.no_price ?? row.noPrice);

  const outcomePrices = parseMaybeArray(row.outcomePrices ?? row.outcome_prices);
  const parsedOutcomeNums = outcomePrices.map((v) => parseNum(v)).filter((v): v is number => v !== null);
  const yesPrice = yesPriceDirect ?? (parsedOutcomeNums.length > 0 ? parsedOutcomeNums[0] : null);
  const noPrice = noPriceDirect ?? (parsedOutcomeNums.length > 1 ? parsedOutcomeNums[1] : null);

  const probability = normalizeProbability(row.probability, yesPrice);
  if (probability === null) return null;

  const rawTags = parseMaybeArray(row.tags);
  const tagText = rawTags.map((tag) => {
    if (tag && typeof tag === "object") {
      const record = tag as Record<string, unknown>;
      return `${String(record.label ?? "")} ${String(record.name ?? "")}`.trim();
    }
    return String(tag ?? "").trim();
  }).join(" ");

  const category = classifyCategory([
    title,
    String(row.description ?? ""),
    String(row.category ?? ""),
    String(row.series ?? ""),
    String(row.topic ?? ""),
    tagText,
  ].join(" "));
  if (category === "other" || !ALLOWED_POLY_CATEGORIES.has(category)) return null;

  const slugRaw = String(row.slug ?? row.market_slug ?? row.id ?? "").trim();
  const marketSlug = slugRaw || `${category}-${slugify(title)}`;
  const providerTs = toIso(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at) ?? new Date().toISOString();

  let status = "active";
  if (row.closed === true || row.active === false) status = "closed";
  if (row.resolved === true || row.archived === true) status = "resolved";

  return {
    market_slug: marketSlug,
    provider_ts: providerTs,
    title: title.slice(0, 240),
    category,
    probability: Math.max(0, Math.min(100, probability)),
    yes_price: yesPrice,
    no_price: noPrice,
    volume: parseNum(row.volume ?? row.volumeNum ?? row.volumeUsd),
    liquidity: parseNum(row.liquidity ?? row.liquidityNum),
    status,
    end_date: toIso(row.endDate ?? row.end_date ?? row.resolveBy),
    source: "POLYMARKET",
    meta: {
      market_id: row.id ?? null,
      outcomes: row.outcomes ?? null,
    },
  };
}

async function fetchPolymarketRows(): Promise<PolymarketRow[]> {
  const url = new URL(`${POLYMARKET_BASE_URL.replace(/\/$/, "")}/markets`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("limit", "1000");

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error("Polymarket HTTP error:", resp.status);
      return [];
    }
    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    const normalized = data
      .map((item) => normalizePolymarketRow(item as Record<string, unknown>))
      .filter((item): item is PolymarketRow => item !== null);

    normalized.sort((a, b) => ((b.volume ?? 0) + (b.liquidity ?? 0)) - ((a.volume ?? 0) + (a.liquidity ?? 0)));
    return normalized;
  } catch (err) {
    console.error("Polymarket request failed:", err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing required edge function secrets" }, 500);
  }

  if (POLYMARKET_COLLECTOR_CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret") ?? "";
    if (!secret || secret !== POLYMARKET_COLLECTOR_CRON_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

  const [btcTick, rows] = await Promise.all([fetchBtcTick(), fetchPolymarketRows()]);

  let btcWritten = false;
  if (btcTick) {
    const { error } = await supabase.from("crypto_ticks").insert({
      provider_ts: btcTick.provider_ts,
      symbol: btcTick.symbol,
      price: Number(btcTick.price.toFixed(6)),
      change_24h: btcTick.change_24h !== null ? Number(btcTick.change_24h.toFixed(6)) : null,
      source: btcTick.source,
      meta: btcTick.meta,
    });
    if (error) {
      console.error("crypto_ticks insert error:", error.message);
    } else {
      btcWritten = true;
    }
  }

  let marketsWritten = 0;
  if (rows.length > 0) {
    const { error: clearError } = await supabase.from("polymarket_markets").delete().neq("market_slug", "");
    if (clearError) {
      console.error("polymarket_markets clear error:", clearError.message);
    }

    const payload = rows.map((row) => ({
      market_slug: row.market_slug,
      provider_ts: row.provider_ts,
      title: row.title,
      category: row.category,
      probability: Number(row.probability.toFixed(4)),
      yes_price: row.yes_price !== null ? Number(row.yes_price.toFixed(6)) : null,
      no_price: row.no_price !== null ? Number(row.no_price.toFixed(6)) : null,
      volume: row.volume !== null ? Number(row.volume.toFixed(2)) : null,
      liquidity: row.liquidity !== null ? Number(row.liquidity.toFixed(2)) : null,
      status: row.status,
      end_date: row.end_date,
      source: row.source,
      meta: row.meta,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("polymarket_markets").upsert(payload, { onConflict: "market_slug" });
    if (error) {
      console.error("polymarket_markets upsert error:", error.message);
    } else {
      marketsWritten = payload.length;
    }
  }

  return jsonResponse({
    ok: true,
    btc_written: btcWritten,
    markets_written: marketsWritten,
    markets_fetched: rows.length,
  });
});
