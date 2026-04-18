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
const TOP_MARKETS_LIMIT = Number(Deno.env.get("POLYMARKET_TOP_MARKETS_LIMIT") ?? 15) || 15;
const ACTIVE_MARKETS_LIMIT = Number(Deno.env.get("POLYMARKET_ACTIVE_MARKETS_LIMIT") ?? 180) || 180;
const COMMODITIES_EVENTS_LIMIT = Number(Deno.env.get("POLYMARKET_COMMODITIES_EVENTS_LIMIT") ?? 120) || 120;
const RECENT_MARKETS_LIMIT = Number(Deno.env.get("POLYMARKET_RECENT_MARKETS_LIMIT") ?? 30) || 30;
const CATEGORY_PRIORITY: Record<string, number> = {
  xauusd: 80,
  oil: 75,
  geopolitics: 70,
  crypto: 68,
  politics: 65,
  finance: 60,
  breaking: 50,
  new: 45,
  trending: 40,
  other: 0,
};
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

function classifyContentCategory(text: string): string {
  const t = text.toLowerCase();
  if (/\b(breaking|headline|urgent)\b/.test(t)) return "breaking";
  if (/\b(xauusd|xau|spot gold|gold price|bullion|precious metal)\b/.test(t)) return "xauusd";
  if (/\b(oil|brent|wti|crude|opec|energy)\b/.test(t)) return "oil";
  if (/\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)\b/.test(t)) return "crypto";
  if (/\b(politics|election|president|senate|congress|minister|government|white house|parliament|trump|biden)\b/.test(t)) return "politics";
  if (/\b(war|ukraine|russia|israel|gaza|taiwan|geopolitic|missile|sanction|ceasefire|conflict|putin|xi jinping|iran|nato|military)\b/.test(t)) return "geopolitics";
  if (/\b(finance|financial|fomc|fed|powell|rate cut|rate hike|interest rate|us rates|cpi|pce|nfp|inflation|gdp|economy|tariff|yield|stocks|nasdaq|dow|s&p|bond|dollar|usd|bitcoin|btc|ethereum|eth|solana|crypto|token|coin|doge|memecoin|altcoin|defi|etf)\b/.test(t)) return "finance";
  return "other";
}

function deriveDisplayCategories(text: string, sourceTag: string, rawCategory = ""): string[] {
  const blob = `${rawCategory} ${text}`.toLowerCase();
  const categories: string[] = [];
  const content = classifyContentCategory(blob);
  if (content !== "other") categories.push(content);
  if (/\b(breaking|headline|urgent|flash|developing)\b/.test(blob)) categories.push("breaking");
  if (sourceTag === "recent") categories.push("new");
  if (sourceTag === "top") categories.push("trending");
  if (sourceTag === "active" && categories.length === 0) categories.push("trending");
  return Array.from(new Set(categories.length ? categories : ["other"]));
}

function chooseDisplayCategory(text: string, sourceTag: string, rawCategory = ""): string {
  const categories = deriveDisplayCategories(text, sourceTag, rawCategory);
  return categories.sort((a, b) => (CATEGORY_PRIORITY[b] ?? 0) - (CATEGORY_PRIORITY[a] ?? 0))[0] ?? "other";
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

function normalizePolymarketRow(row: Record<string, unknown>, sourceTag = "top"): PolymarketRow | null {
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

  const rawCategory = String(row.category ?? "").trim().toLowerCase() || "other";
  const displayCategories = deriveDisplayCategories([
    title,
    String(row.description ?? ""),
    rawCategory,
    String(row.series ?? ""),
    String(row.topic ?? ""),
    tagText,
  ].join(" "), sourceTag, rawCategory);
  const displayCategory = displayCategories.sort((a, b) => (CATEGORY_PRIORITY[b] ?? 0) - (CATEGORY_PRIORITY[a] ?? 0))[0] ?? "other";

  const slugRaw = String(row.slug ?? row.market_slug ?? row.id ?? "").trim();
  const marketSlug = slugRaw || `${displayCategory}-${slugify(title)}`;
  const providerTs = toIso(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at) ?? new Date().toISOString();

  let status = "active";
  if (row.closed === true || row.active === false) status = "closed";
  if (row.resolved === true || row.archived === true) status = "resolved";

  return {
    market_slug: marketSlug,
    provider_ts: providerTs,
    title: title.slice(0, 240),
    category: rawCategory,
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
      raw_category: rawCategory,
      display_category: displayCategory,
      display_categories: displayCategories,
      collector_source: sourceTag,
    },
  };
}

async function fetchJson(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${POLYMARKET_BASE_URL.replace(/\/$/, "")}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Polymarket HTTP error ${path}:`, resp.status);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.error(`Polymarket request failed ${path}:`, err);
    return null;
  }
}

async function fetchTopVolumeMarkets(): Promise<PolymarketRow[]> {
  const data = await fetchJson("/markets", {
    active: "true",
    closed: "false",
    order: "volumeNum",
    ascending: "false",
    limit: String(TOP_MARKETS_LIMIT),
  });
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizePolymarketRow(item as Record<string, unknown>, "top"))
    .filter((item): item is PolymarketRow => item !== null);
}

async function fetchActiveMarkets(): Promise<PolymarketRow[]> {
  const data = await fetchJson("/markets", {
    active: "true",
    closed: "false",
    order: "volumeNum",
    ascending: "false",
    limit: String(ACTIVE_MARKETS_LIMIT),
  });
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizePolymarketRow(item as Record<string, unknown>, "active"))
    .filter((item): item is PolymarketRow => item !== null);
}

async function fetchRecentMarkets(): Promise<PolymarketRow[]> {
  const data = await fetchJson("/markets", {
    active: "true",
    closed: "false",
    order: "createdAt",
    ascending: "false",
    limit: String(RECENT_MARKETS_LIMIT),
  });
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizePolymarketRow(item as Record<string, unknown>, "recent"))
    .filter((item): item is PolymarketRow => item !== null);
}

async function fetchCommodityEventMarkets(): Promise<PolymarketRow[]> {
  const data = await fetchJson("/events", {
    tag_slug: "commodities",
    closed: "false",
    limit: String(COMMODITIES_EVENTS_LIMIT),
  });
  if (!Array.isArray(data)) return [];
  const out: PolymarketRow[] = [];
  data.forEach((event) => {
    if (!event || typeof event !== "object") return;
    const record = event as Record<string, unknown>;
    const eventContext = [
      String(record.title ?? ""),
      String(record.question ?? ""),
      String(record.slug ?? ""),
      String(record.description ?? ""),
      "commodities",
    ].join(" ");
    const markets = record.markets;
    if (!Array.isArray(markets)) return;
    markets.forEach((market) => {
      if (!market || typeof market !== "object") return;
      const merged = {
        ...(market as Record<string, unknown>),
        category: (market as Record<string, unknown>).category ?? record.category ?? "commodities",
        description: `${String((market as Record<string, unknown>).description ?? "")} ${eventContext}`.trim(),
      };
      const row = normalizePolymarketRow(merged, "commodity");
      if (row && ["xauusd", "oil"].includes(String(row.meta.display_category ?? ""))) {
        out.push(row);
      }
    });
  });
  return out;
}

function mergeMarkets(...marketLists: PolymarketRow[][]): PolymarketRow[] {
  const merged = new Map<string, PolymarketRow>();
  marketLists.flat().forEach((row) => {
    const slug = String(row.market_slug || "").trim();
    if (!slug) return;
    const displayCategory = String(row.meta.display_category ?? "other");
    const existing = merged.get(slug);
    if (!existing) {
      merged.set(slug, row);
      return;
    }
    const existingDisplay = String(existing.meta.display_category ?? "other");
    if ((CATEGORY_PRIORITY[displayCategory] ?? 0) > (CATEGORY_PRIORITY[existingDisplay] ?? 0)) {
      merged.set(slug, row);
      return;
    }
    if ((row.volume ?? 0) > (existing.volume ?? 0)) {
      merged.set(slug, row);
    }
  });
  return Array.from(merged.values()).sort((a, b) => ((b.volume ?? 0) + (b.liquidity ?? 0)) - ((a.volume ?? 0) + (a.liquidity ?? 0)));
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

  const [btcTick, topRows, activeRows, recentRows, commodityRows] = await Promise.all([
    fetchBtcTick(),
    fetchTopVolumeMarkets(),
    fetchActiveMarkets(),
    fetchRecentMarkets(),
    fetchCommodityEventMarkets(),
  ]);
  const rows = mergeMarkets(topRows, activeRows, recentRows, commodityRows);

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
    top_markets: topRows.length,
    active_markets: activeRows.length,
    recent_markets: recentRows.length,
    commodity_markets: commodityRows.length,
  });
});
