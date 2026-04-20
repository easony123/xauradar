/**
 * api.js - Data layer
 * Uses Supabase as the single browser-side data source.
 * Market prices are collected server-side and stored in `market_ticks`.
 */

// Supabase config
const SUPABASE_URL = 'https://autbjwirftpixizrrzhw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A_gXMbmff2IFJbZX1wsKrA_sXz6jzkQ';
const POLYMARKET_PROXY_URL = `${SUPABASE_URL}/functions/v1/polymarket-collector`;

// State
let supabaseClient = null;
let lastPrice = null;
let priceDirection = null; // 'up' | 'down' | null
let lastLiveSnapshot = null;
const API_XAU_PIP_SIZE = 0.1;

function normalizeSource(raw) {
  const src = String(raw || '').trim().toUpperCase();
  if (['TD_LIVE', 'LIVE', 'QUOTE'].includes(src)) return 'TD_LIVE';
  if (['TD_DELAYED', 'DELAY', '1M', 'AGG_1M'].includes(src)) return 'TD_DELAYED';
  if (['STALE', 'PREV', 'AGG_PREV'].includes(src)) return 'STALE';
  return src || 'STALE';
}

function tryParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function toXauPipsApi(priceDelta) {
  const n = parseNumber(priceDelta, NaN);
  if (!Number.isFinite(n)) return NaN;
  const pipSize = Number.isFinite(API_XAU_PIP_SIZE) && API_XAU_PIP_SIZE > 0 ? API_XAU_PIP_SIZE : 0.1;
  return n / pipSize;
}

function toMillis(value) {
  if (!value) return null;
  const d = new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

const XAU_LOT_OUNCES = 100;
const XAU_USD_PER_PIP_PER_LOT = API_XAU_PIP_SIZE * XAU_LOT_OUNCES;

function normalizeSignalStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function isWinningSignalStatus(status) {
  return ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(normalizeSignalStatus(status));
}

function isNeutralSignalStatus(status) {
  return ['BREAKEVEN', 'EXPIRED'].includes(normalizeSignalStatus(status));
}

function isClosedSignalStatus(status) {
  return [...new Set(['HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'BREAKEVEN', 'EXPIRED'])].includes(normalizeSignalStatus(status));
}

function parseTradeMetadata(value) {
  const parsed = tryParseJson(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function getTradePriceMove(side, entry, closePrice) {
  return String(side || 'BUY').toUpperCase() === 'SELL'
    ? entry - closePrice
    : closePrice - entry;
}

function getEffectiveTradeStatus(tradeStatus, signalStatus) {
  const currentTradeStatus = normalizeSignalStatus(tradeStatus);
  if (currentTradeStatus !== 'OPEN') return currentTradeStatus;

  const parentSignalStatus = normalizeSignalStatus(signalStatus);
  if (!parentSignalStatus || parentSignalStatus === 'ACTIVE') return 'OPEN';
  if (parentSignalStatus === 'HIT_SL') return 'LOSS';
  if (isWinningSignalStatus(parentSignalStatus)) return 'WIN';
  if (isNeutralSignalStatus(parentSignalStatus)) return parentSignalStatus;
  return currentTradeStatus;
}

function emptyPerformanceStats() {
  return {
    totalSignals: 0,
    winCount: 0,
    lossCount: 0,
    winRate: '0.0',
    totalPips: '0.0',
    expectancy: '0.00',
    avgRR: '0.00',
    drawdown: '0.00',
    tp1Hits: 0,
    tp2Hits: 0,
    tp3Hits: 0,
    slHits: 0,
    laneStats: {
      intraday: { count: 0, winRate: '0.0', expectancy: '0.00', avgRR: '0.00' },
      swing: { count: 0, winRate: '0.0', expectancy: '0.00', avgRR: '0.00' },
    },
    windows: {
      w50: { expectancy: '0.00', winRate: '0.0' },
      w100: { expectancy: '0.00', winRate: '0.0' },
      w300: { expectancy: '0.00', winRate: '0.0' },
    },
  };
}

function buildDemoPerformance(account, trades = [], equityPoints = [], events = [], livePrice = NaN) {
  if (!account) return null;

  const starting = parseNumber(account.starting_capital, 100000);
  const balance = parseNumber(account.balance, starting);
  const liveMarkPrice = parseNumber(livePrice, NaN);

  const normalizedTrades = (Array.isArray(trades) ? trades : []).map((trade) => {
    const metadata = parseTradeMetadata(trade.metadata);
    const tradeStatus = normalizeSignalStatus(trade.status);
    const signalStatus = normalizeSignalStatus(trade.signal_status || trade.signal?.status);
    const entry = parseNumber(trade.entry, 0);
    const tradeSize = parseNumber(trade.position_size, 0);
    const initialPositionSize = parseNumber(metadata.initial_position_size, tradeSize);
    const remainingPositionSize = parseNumber(metadata.remaining_position_size, tradeSize);
    const realizedPnlUsd = parseNumber(metadata.realized_pnl_usd, parseNumber(trade.pnl_usd, 0));
    const realizedPnlPips = parseNumber(metadata.realized_pnl_pips, parseNumber(trade.pnl_pips, 0));
    const effectiveStatus = getEffectiveTradeStatus(tradeStatus, signalStatus);
    const isEffectiveOpen = effectiveStatus === 'OPEN';

    let unrealizedPnlUsd = 0;
    let livePnlUsd = parseNumber(trade.pnl_usd, realizedPnlUsd);
    let livePnlPips = parseNumber(trade.pnl_pips, realizedPnlPips);
    let markPrice = null;

    if (isEffectiveOpen && Number.isFinite(liveMarkPrice)) {
      const priceMove = getTradePriceMove(trade.side, entry, liveMarkPrice);
      const liveSize = Math.max(remainingPositionSize, 0);
      unrealizedPnlUsd = priceMove * liveSize;
      livePnlUsd = realizedPnlUsd + unrealizedPnlUsd;
      livePnlPips = realizedPnlPips + ((priceMove / API_XAU_PIP_SIZE) * (liveSize / Math.max(initialPositionSize, 1e-9)));
      markPrice = liveMarkPrice;
    }

    return {
      ...trade,
      metadata,
      signal_status: signalStatus || null,
      effectiveStatus,
      isEffectiveOpen,
      realizedPnlUsd,
      unrealizedPnlUsd,
      livePnlUsd,
      livePnlPips,
      initialPositionSize,
      remainingPositionSize,
      markPrice,
    };
  });

  const effectiveOpenTrades = normalizedTrades.filter((trade) => trade.isEffectiveOpen);
  const closedTrades = normalizedTrades.filter((trade) => !trade.isEffectiveOpen && trade.effectiveStatus !== 'OPEN');
  const wins = closedTrades.filter((trade) => trade.effectiveStatus === 'WIN');
  const losses = closedTrades.filter((trade) => trade.effectiveStatus === 'LOSS');
  const totalClosed = closedTrades.length;
  const winRate = totalClosed > 0 ? (wins.length / totalClosed) * 100 : 0;
  const unrealizedPnlTotal = effectiveOpenTrades.reduce((acc, trade) => acc + parseNumber(trade.unrealizedPnlUsd, 0), 0);
  const closedPnlTotal = balance - starting;
  const pnlTotal = closedPnlTotal + unrealizedPnlTotal;
  const equity = balance + unrealizedPnlTotal;
  const roiPct = starting > 0 ? ((equity - starting) / starting) * 100 : 0;
  const expectancyR = totalClosed > 0
    ? closedTrades.reduce((acc, trade) => acc + parseNumber(trade.pnl_r, 0), 0) / totalClosed
    : 0;

  const basePoints = Array.isArray(equityPoints)
    ? equityPoints.map((point) => ({
      ...point,
      balance: parseNumber(point.balance, 0),
      equity: parseNumber(point.equity, 0),
    }))
    : [];
  const points = basePoints.slice();
  if (points.length === 0 || parseNumber(points[points.length - 1]?.equity, NaN) !== equity) {
    points.push({
      ts: new Date().toISOString(),
      equity,
      balance,
    });
  }

  let peak = starting;
  let maxDrawdownPct = 0;
  points.forEach((point) => {
    const value = parseNumber(point.equity, 0);
    if (value > peak) peak = value;
    if (peak > 0) {
      const drawdownPct = ((peak - value) / peak) * 100;
      if (drawdownPct > maxDrawdownPct) maxDrawdownPct = drawdownPct;
    }
  });

  const laneStats = ['intraday', 'swing'].reduce((out, lane) => {
    const rows = closedTrades.filter((trade) => String(trade.lane || 'intraday').toLowerCase() === lane);
    const laneWins = rows.filter((trade) => trade.effectiveStatus === 'WIN').length;
    out[lane] = {
      trades: rows.length,
      winRate: rows.length > 0 ? (laneWins / rows.length) * 100 : 0,
      pnl: rows.reduce((acc, trade) => acc + parseNumber(trade.livePnlUsd, 0), 0),
    };
    return out;
  }, {});

  return {
    account,
    balance,
    equity,
    starting,
    roiPct,
    openTrades: effectiveOpenTrades.length,
    totalClosed,
    wins: wins.length,
    losses: losses.length,
    winRate,
    pnlTotal,
    closedPnlTotal,
    unrealizedPnlTotal,
    expectancyR,
    maxDrawdownPct,
    laneStats,
    equityPointsBase: basePoints,
    equityPoints: points,
    trades: normalizedTrades,
    events: Array.isArray(events) ? events : [],
    effectiveOpenTrades,
  };
}

const POLYMARKET_BASE_URL = 'https://gamma-api.polymarket.com';
const POLYMARKET_MARKET_PAGE_SIZE = 200;
const POLYMARKET_CATEGORY_PRIORITY = {
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

function normalizeSource(raw) {
  const src = String(raw || '').trim().toUpperCase();
  if (['TD_LIVE', 'LIVE', 'QUOTE'].includes(src)) return 'TD_LIVE';
  if (['TD_DELAYED', 'DELAY', '1M', 'AGG_1M'].includes(src)) return 'TD_DELAYED';
  if (['STALE', 'PREV', 'AGG_PREV'].includes(src)) return 'STALE';
  return src || 'STALE';
}

function tryParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function toXauPipsApi(priceDelta) {
  const n = parseNumber(priceDelta, NaN);
  if (!Number.isFinite(n)) return NaN;
  const pipSize = Number.isFinite(API_XAU_PIP_SIZE) && API_XAU_PIP_SIZE > 0 ? API_XAU_PIP_SIZE : 0.1;
  return n / pipSize;
}

function toMillis(value) {
  if (!value) return null;
  const d = new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeProbabilityPercent(raw, fallbackYesPrice = null) {
  const n = parseNumber(raw, NaN);
  if (Number.isFinite(n)) {
    if (n >= 0 && n <= 1) return n * 100;
    if (n >= 0 && n <= 100) return n;
  }
  if (Number.isFinite(fallbackYesPrice)) {
    return clamp(fallbackYesPrice * 100, 0, 100);
  }
  return NaN;
}

function parseMaybeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function uniqueStrings(values = []) {
  const out = [];
  values.forEach((value) => {
    const text = String(value || '').trim().toLowerCase();
    if (text && !out.includes(text)) out.push(text);
  });
  return out;
}

function classifyPolymarketCategory(text = '') {
  const t = String(text || '').toLowerCase();
  if (/\b(breaking|headline|urgent)\b/.test(t)) return 'breaking';
  if (/\b(xauusd|xau|spot gold|gold price|bullion|precious metal)\b/.test(t)) return 'xauusd';
  if (/\b(oil|brent|wti|crude|opec|energy)\b/.test(t)) return 'oil';
  if (/\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)\b/.test(t)) return 'crypto';
  if (/\b(politics|election|president|senate|congress|minister|government|white house|parliament|trump|biden)\b/.test(t)) return 'politics';
  if (/\b(war|ukraine|russia|israel|gaza|taiwan|geopolitic|missile|sanction|ceasefire|conflict|putin|xi jinping|iran|nato|military)\b/.test(t)) return 'geopolitics';
  if (/\b(finance|financial|fomc|fed|powell|rate cut|rate hike|interest rate|us rates|cpi|pce|nfp|inflation|gdp|economy|tariff|yield|stocks|nasdaq|dow|s&p|bond|dollar|usd|etf)\b/.test(t)) return 'finance';
  return 'other';
}

function looksLikeBreakingMarket(text = '') {
  return /\b(breaking|headline|urgent|flash|developing|ceasefire|deal|meeting|summit|talks|diplomatic|sanction|attack|missile|war|conflict|tariff|fed|fomc|rate cut|rate hike|interest rate|election|vote|approval|ban|default|bankruptcy|merger|earnings)\b/.test(String(text || '').toLowerCase());
}

function derivePolymarketDisplayCategories(text = '', sourceTag = 'active', rawCategory = '') {
  const blob = `${rawCategory} ${text}`.toLowerCase();
  const categories = [];
  const contentCategory = classifyPolymarketCategory(blob);
  if (contentCategory !== 'other') categories.push(contentCategory);
  if (looksLikeBreakingMarket(blob) && ['politics', 'geopolitics', 'finance'].includes(contentCategory)) {
    categories.push('breaking');
  }
  if (sourceTag === 'recent') categories.push('new');
  if (sourceTag === 'top') categories.push('trending');
  if (sourceTag === 'breaking') categories.push('breaking');
  if (sourceTag === 'active' && categories.length === 0) categories.push('trending');
  return uniqueStrings(categories.length ? categories : ['other']);
}

function mergePolymarketMeta(existing = {}, incoming = {}) {
  const categories = uniqueStrings([
    ...(Array.isArray(existing.display_categories) ? existing.display_categories : []),
    ...(Array.isArray(incoming.display_categories) ? incoming.display_categories : []),
  ]);
  const collectorSources = uniqueStrings([
    ...(Array.isArray(existing.collector_sources) ? existing.collector_sources : []),
    existing.collector_source,
    ...(Array.isArray(incoming.collector_sources) ? incoming.collector_sources : []),
    incoming.collector_source,
  ]);
  const displayCategory = categories
    .slice()
    .sort((a, b) => (POLYMARKET_CATEGORY_PRIORITY[b] || 0) - (POLYMARKET_CATEGORY_PRIORITY[a] || 0))[0] || 'other';

  return {
    ...existing,
    ...incoming,
    display_category: displayCategory,
    display_categories: categories.length ? categories : ['other'],
    collector_source: collectorSources[0] || incoming.collector_source || existing.collector_source || 'active',
    collector_sources: collectorSources,
  };
}

function mergePolymarketRows(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;
  const existingMeta = existing.meta && typeof existing.meta === 'object' ? existing.meta : {};
  const incomingMeta = incoming.meta && typeof incoming.meta === 'object' ? incoming.meta : {};
  const incomingPriority = POLYMARKET_CATEGORY_PRIORITY[String(incomingMeta.display_category || 'other')] || 0;
  const existingPriority = POLYMARKET_CATEGORY_PRIORITY[String(existingMeta.display_category || 'other')] || 0;
  const pickIncoming = incomingPriority >= existingPriority || parseNumber(incoming.volume, 0) > parseNumber(existing.volume, 0);
  const primary = pickIncoming ? incoming : existing;
  const secondary = pickIncoming ? existing : incoming;

  return {
    ...primary,
    title: String(primary.title || secondary.title || '').slice(0, 240),
    category: String(primary.category || secondary.category || 'other'),
    probability: Number.isFinite(Number(primary.probability)) ? Number(primary.probability) : Number(secondary.probability),
    yes_price: Number.isFinite(Number(primary.yes_price)) ? Number(primary.yes_price) : parseNumber(secondary.yes_price, NaN),
    no_price: Number.isFinite(Number(primary.no_price)) ? Number(primary.no_price) : parseNumber(secondary.no_price, NaN),
    volume: Number.isFinite(Number(primary.volume)) ? Number(primary.volume) : parseNumber(secondary.volume, NaN),
    liquidity: Number.isFinite(Number(primary.liquidity)) ? Number(primary.liquidity) : parseNumber(secondary.liquidity, NaN),
    provider_ts: primary.provider_ts || secondary.provider_ts || new Date().toISOString(),
    meta: mergePolymarketMeta(existingMeta, incomingMeta),
  };
}

function mergePolymarketMarketLists(...lists) {
  const merged = new Map();
  lists.flat().forEach((row) => {
    const slug = String(row?.market_slug || '').trim();
    if (!slug) return;
    const existing = merged.get(slug);
    merged.set(slug, existing ? mergePolymarketRows(existing, row) : row);
  });
  return Array.from(merged.values()).sort(
    (a, b) => (parseNumber(b.volume, 0) + parseNumber(b.liquidity, 0)) - (parseNumber(a.volume, 0) + parseNumber(a.liquidity, 0))
  );
}

function normalizePolymarketApiRow(row, sourceTag = 'active') {
  if (!row || typeof row !== 'object') return null;
  const title = String(row.question ?? row.title ?? row.name ?? '').trim();
  if (!title) return null;

  const directYes = parseNumber(row.yes_price ?? row.yesPrice, NaN);
  const directNo = parseNumber(row.no_price ?? row.noPrice, NaN);
  const outcomePrices = parseMaybeArray(row.outcomePrices ?? row.outcome_prices)
    .map((value) => parseNumber(value, NaN))
    .filter((value) => Number.isFinite(value));
  const yesPrice = Number.isFinite(directYes) ? directYes : outcomePrices[0];
  const noPrice = Number.isFinite(directNo) ? directNo : outcomePrices[1];
  const probability = normalizeProbabilityPercent(row.probability, yesPrice);
  if (!Number.isFinite(probability)) return null;

  const rawTags = parseMaybeArray(row.tags);
  const tagText = rawTags.map((tag) => {
    if (tag && typeof tag === 'object') {
      return `${String(tag.label ?? '')} ${String(tag.name ?? '')}`.trim();
    }
    return String(tag || '').trim();
  }).join(' ');

  const rawCategory = String(row.category || '').trim().toLowerCase() || 'other';
  const context = [
    title,
    String(row.description ?? ''),
    rawCategory,
    String(row.series ?? ''),
    String(row.topic ?? ''),
    tagText,
  ].join(' ');
  const displayCategories = derivePolymarketDisplayCategories(context, sourceTag, rawCategory);
  const displayCategory = displayCategories
    .slice()
    .sort((a, b) => (POLYMARKET_CATEGORY_PRIORITY[b] || 0) - (POLYMARKET_CATEGORY_PRIORITY[a] || 0))[0] || 'other';

  let status = 'active';
  if (row.closed === true || row.active === false) status = 'closed';
  if (row.resolved === true || row.archived === true) status = 'resolved';

  return {
    market_slug: String(row.slug ?? row.market_slug ?? row.id ?? '').trim(),
    provider_ts: row.updatedAt || row.updated_at || row.createdAt || row.created_at || new Date().toISOString(),
    title: title.slice(0, 240),
    category: rawCategory,
    probability: clamp(probability, 0, 100),
    yes_price: Number.isFinite(yesPrice) ? yesPrice : null,
    no_price: Number.isFinite(noPrice) ? noPrice : null,
    volume: parseNumber(row.volume ?? row.volumeNum ?? row.volumeUsd, NaN),
    liquidity: parseNumber(row.liquidity ?? row.liquidityNum, NaN),
    status,
    end_date: row.endDate || row.end_date || row.resolveBy || null,
    source: 'POLYMARKET',
    meta: {
      market_id: row.id ?? null,
      outcomes: row.outcomes ?? null,
      raw_category: rawCategory,
      display_category: displayCategory,
      display_categories: displayCategories,
      collector_source: sourceTag,
      collector_sources: [sourceTag],
      live_source: 'gamma',
    },
  };
}

async function fetchPolymarketGammaJson(path, params = {}) {
  const url = new URL(`${POLYMARKET_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Gamma ${path} request failed with ${response.status}`);
  }
  return response.json();
}

async function fetchPolymarketProxyJson(params = {}) {
  const url = new URL(POLYMARKET_PROXY_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`Polymarket proxy request failed with ${response.status}`);
  }
  return response.json();
}

async function fetchPolymarketLiveSlice(sourceTag, params, totalLimit) {
  const rows = [];
  const seen = new Set();
  let offset = 0;

  while (rows.length < totalLimit) {
    const pageLimit = Math.min(POLYMARKET_MARKET_PAGE_SIZE, totalLimit - rows.length);
    const page = await fetchPolymarketGammaJson('/markets', {
      ...params,
      limit: pageLimit,
      offset,
    });
    if (!Array.isArray(page) || page.length === 0) break;

    let added = 0;
    page.forEach((item) => {
      const normalized = normalizePolymarketApiRow(item, sourceTag);
      const slug = String(normalized?.market_slug || '').trim();
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      rows.push(normalized);
      added += 1;
    });

    if (page.length < pageLimit || added === 0) break;
    offset += page.length;
  }

  return rows;
}

async function fetchPolymarketCommodityLiveMarkets(totalLimit = 100) {
  const out = [];
  let offset = 0;

  while (out.length < totalLimit) {
    const pageLimit = Math.min(POLYMARKET_MARKET_PAGE_SIZE, totalLimit - out.length);
    const page = await fetchPolymarketGammaJson('/events', {
      tag_slug: 'commodities',
      closed: 'false',
      limit: pageLimit,
      offset,
    });
    if (!Array.isArray(page) || page.length === 0) break;

    page.forEach((event) => {
      const eventContext = [
        String(event?.title ?? ''),
        String(event?.question ?? ''),
        String(event?.slug ?? ''),
        String(event?.description ?? ''),
        'commodities',
      ].join(' ');
      const markets = Array.isArray(event?.markets) ? event.markets : [];
      markets.forEach((market) => {
        const merged = {
          ...(market || {}),
          category: market?.category || event?.category || 'commodities',
          description: `${String(market?.description ?? '')} ${eventContext}`.trim(),
        };
        const normalized = normalizePolymarketApiRow(merged, 'commodity');
        const displayCategory = String(normalized?.meta?.display_category || '');
        if (normalized && ['xauusd', 'oil'].includes(displayCategory)) {
          out.push(normalized);
        }
      });
    });

    if (page.length < pageLimit) break;
    offset += page.length;
  }

  return mergePolymarketMarketLists(out).slice(0, totalLimit);
}

function normalizeSignal(signal) {
  if (!signal) return null;

  const signalType = signal.signal_type || signal.type || null;
  const stopLoss = signal.stop_loss ?? signal.sl ?? null;
  const conditions = tryParseJson(signal.conditions_met);
  const scoreBreakdown = tryParseJson(signal.score_breakdown);
  const newsContext = tryParseJson(signal.news_context);
  const riskContext = tryParseJson(signal.risk_context);

  return {
    ...signal,
    signal_type: signalType,
    type: signalType,
    stop_loss: stopLoss,
    sl: stopLoss,
    conditions_met: conditions,
    score_breakdown: scoreBreakdown || {},
    news_context: newsContext || {},
    risk_context: riskContext || {},
    lane: signal.lane || 'intraday',
    blocked_reason: signal.blocked_reason || null,
  };
}

function normalizeSnapshot(snapshot) {
  if (!snapshot) return null;

  const adxValue = snapshot.adx_value ?? snapshot.adx ?? 0;
  const atrValue = snapshot.atr_value ?? snapshot.atr ?? 0;
  const macdValue = snapshot.macd_value ?? snapshot.macd_histogram ?? 0;

  return {
    ...snapshot,
    adx_value: adxValue,
    atr_value: atrValue,
    macd_value: macdValue,
  };
}

function normalizeDecisionCandidate(candidate, lane = 'intraday') {
  const raw = tryParseJson(candidate);
  if (!raw || typeof raw !== 'object') return null;

  const normalized = normalizeSignal({
    ...raw,
    id: raw.signal_id || raw.id || null,
    lane: raw.lane || lane,
    type: raw.type || raw.signal_type || null,
    sl: raw.sl ?? raw.stop_loss ?? null,
    conditions_met: tryParseJson(raw.conditions_met) || {},
    score_breakdown: tryParseJson(raw.score_breakdown) || {},
    news_context: tryParseJson(raw.news_context) || {},
    risk_context: tryParseJson(raw.risk_context) || {},
  }) || {};

  return {
    ...normalized,
    id: raw.signal_id || raw.id || null,
    signal_id: raw.signal_id || raw.id || null,
    lane: raw.lane || lane,
    decision_state: raw.decision_state || 'NOT_READY',
    selected_side: raw.selected_side || raw.type || normalized.type || null,
    selected_signal_id: raw.selected_signal_id || raw.signal_id || raw.id || null,
    reason: raw.reason || raw.decision_reason || raw.blocked_reason || '',
    market_price: parseNumber(raw.market_price, NaN),
    h1_regime: raw.h1_regime || normalized?.conditions_met?.adaptive_exits?.regime || null,
  };
}

function normalizeDecisionLane(decision, lane = 'intraday') {
  const raw = tryParseJson(decision);
  const normalized = normalizeDecisionCandidate(raw, lane) || {
    lane,
    type: 'WAIT',
    decision_state: 'NOT_READY',
    status: 'REJECTED',
    conditions_met: {},
    score_breakdown: {},
    news_context: {},
    risk_context: {},
  };

  const candidateMap = (raw && typeof raw === 'object' && raw.candidates && typeof raw.candidates === 'object')
    ? raw.candidates
    : {};

  return {
    ...normalized,
    lane,
    candidates: {
      buy: normalizeDecisionCandidate(candidateMap.buy, lane),
      sell: normalizeDecisionCandidate(candidateMap.sell, lane),
    },
  };
}

function normalizeDecisionRun(row) {
  if (!row) return null;
  return {
    ...row,
    lanes: {
      intraday: normalizeDecisionLane(row.intraday_decision, 'intraday'),
      swing: normalizeDecisionLane(row.swing_decision, 'swing'),
    },
  };
}

/**
 * Initialize Supabase client.
 */
function initSupabase() {
  const sdk = typeof window !== 'undefined' ? window.supabase : null;
  if (!sdk || typeof sdk.createClient !== 'function') {
    console.warn('Supabase SDK not loaded (window.supabase missing).');
    return false;
  }

  try {
    supabaseClient = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
    return true;
  } catch (err) {
    console.warn('Supabase client init failed:', err?.message || err);
    supabaseClient = null;
    return false;
  }
}

async function signUpWithEmail(email, password) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

async function signInWithEmail(email, password) {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

async function signOutAuth() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getCurrentSession() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

/**
 * Fetch latest market tick from Supabase cache.
 * Returns: { price, bid, ask, direction, spread, timestamp, source, isDelayed, pair }
 */
async function fetchLivePrice() {
  if (!supabaseClient) return lastLiveSnapshot;

  try {
    const { data, error } = await supabaseClient
      .from('market_ticks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) throw error;
    if (!data || data.length === 0) return lastLiveSnapshot;

    const row = data[0];
    const prevRow = data.length > 1 ? data[1] : null;
    const price = parseNumber(row.price, 0);
    if (!price) return lastLiveSnapshot;

    const bid = parseNumber(row.bid, price);
    const ask = parseNumber(row.ask, price);
    const ts = toMillis(row.provider_ts) || toMillis(row.created_at) || Date.now();

    const prevPrice = prevRow ? parseNumber(prevRow.price, NaN) : NaN;
    let changeValue = null;
    let changePct = null;
    if (Number.isFinite(prevPrice)) {
      priceDirection = price > prevPrice ? 'up' : price < prevPrice ? 'down' : null;
      changeValue = price - prevPrice;
      changePct = prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
    } else if (lastPrice !== null) {
      priceDirection = price > lastPrice ? 'up' : price < lastPrice ? 'down' : null;
      changeValue = price - lastPrice;
      changePct = lastPrice !== 0 ? ((price - lastPrice) / lastPrice) * 100 : 0;
    }
    lastPrice = price;

    const ageMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    const stale = ageMin >= 15;

    const source = normalizeSource(row.source);
    const snapshot = {
      price,
      bid,
      ask,
      direction: priceDirection,
      changeValue,
      changePct,
      spread: Math.max(0, ask - bid),
      timestamp: ts,
      source: stale ? 'STALE' : source,
      isDelayed: Boolean(row.is_delayed) || stale,
      isStale: stale,
      ageMinutes: ageMin,
      pair: row.symbol || 'XAU/USD',
    };

    lastLiveSnapshot = snapshot;
    return snapshot;
  } catch (err) {
    console.error('Supabase live price error:', err.message);
    return lastLiveSnapshot;
  }
}

/**
 * Aggregate cached ticks into OHLC candles for the chart.
 */
async function fetchChartCandles(bars = 100, minutes = 15) {
  if (!supabaseClient) return [];

  try {
    const now = Date.now();
    const bucketMs = minutes * 60 * 1000;
    const from = new Date(now - (bars * bucketMs) - (6 * bucketMs)).toISOString();

    const { data, error } = await supabaseClient
      .from('market_ticks')
      .select('created_at,provider_ts,price')
      .gte('created_at', from)
      .order('created_at', { ascending: true })
      .limit(5000);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const buckets = new Map();

    data.forEach((row) => {
      const price = parseNumber(row.price, NaN);
      if (!Number.isFinite(price)) return;

      const ts = toMillis(row.provider_ts) || toMillis(row.created_at);
      if (!ts) return;

      const bucket = Math.floor(ts / bucketMs) * bucketMs;
      const cur = buckets.get(bucket);

      if (!cur) {
        buckets.set(bucket, {
          time: Math.floor(bucket / 1000),
          open: price,
          high: price,
          low: price,
          close: price,
          _lastTs: ts,
        });
        return;
      }

      cur.high = Math.max(cur.high, price);
      cur.low = Math.min(cur.low, price);
      if (ts >= cur._lastTs) {
        cur.close = price;
        cur._lastTs = ts;
      }
    });

    const candles = Array.from(buckets.values())
      .sort((a, b) => a.time - b.time)
      .slice(-bars)
      .map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    return candles;
  } catch (err) {
    console.error('Chart candle fetch error:', err.message);
    return [];
  }
}

/**
 * Keep legacy method name for compatibility with existing callers.
 */
async function fetchCandles(bars = 100) {
  return await fetchChartCandles(bars, 15);
}

/**
 * Fetch DXY from latest indicator snapshot (server-side populated).
 */
async function fetchDXYPrice() {
  const snapshot = await fetchIndicatorSnapshot();
  if (!snapshot) return null;

  const price = parseNumber(snapshot.dxy_price, 0);
  if (!price) return null;

  return {
    price,
    direction: snapshot.dxy_direction || 'FLAT',
  };
}

async function fetchLatestBtcTick() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('crypto_ticks')
      .select('*')
      .eq('symbol', 'BTC/USD')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const row = data[0];
    return {
      ...row,
      price: parseNumber(row.price, NaN),
      change_24h: parseNumber(row.change_24h, NaN),
      provider_ts: row.provider_ts || row.created_at,
    };
  } catch (err) {
    console.error('BTC tick fetch error:', err.message);
    return null;
  }
}

async function fetchPolymarketMarkets(limit = 1000) {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('polymarket_markets')
      .select('*')
      .order('provider_ts', { ascending: false })
      .order('probability', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row) => ({
      ...row,
      probability: parseNumber(row.probability, NaN),
      yes_price: parseNumber(row.yes_price, NaN),
      no_price: parseNumber(row.no_price, NaN),
      volume: parseNumber(row.volume, NaN),
      liquidity: parseNumber(row.liquidity, NaN),
      meta: tryParseJson(row.meta) || row.meta || {},
    }));
  } catch (err) {
    console.error('Polymarket markets fetch error:', err.message);
    return [];
  }
}

async function fetchPolymarketMarketHistory(marketSlug, limit = 120) {
  if (!supabaseClient) return [];
  const slug = String(marketSlug || '').trim();
  if (!slug) return [];

  try {
    const { data, error } = await supabaseClient
      .from('polymarket_market_snapshots')
      .select('*')
      .eq('market_slug', slug)
      .order('provider_ts', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row) => ({
      ...row,
      probability: parseNumber(row.probability, NaN),
      yes_price: parseNumber(row.yes_price, NaN),
      no_price: parseNumber(row.no_price, NaN),
      volume: parseNumber(row.volume, NaN),
      liquidity: parseNumber(row.liquidity, NaN),
      meta: tryParseJson(row.meta) || row.meta || {},
    }));
  } catch (err) {
    console.error('Polymarket market history fetch error:', err.message);
    return [];
  }
}

async function fetchPolymarketLiveMarkets() {
  const fetchedAt = new Date().toISOString();
  try {
    const payload = await fetchPolymarketProxyJson({ mode: 'live' });
    const markets = Array.isArray(payload?.markets)
      ? payload.markets.map((row) => normalizePolymarketApiRow(row, row?.meta?.collector_source || 'proxy')).filter(Boolean)
      : [];
    const trendingRows = Array.isArray(payload?.slices?.trending)
      ? payload.slices.trending.map((row) => normalizePolymarketApiRow(row, row?.meta?.collector_source || 'top')).filter(Boolean)
      : [];
    const breakingRows = Array.isArray(payload?.slices?.breaking)
      ? payload.slices.breaking.map((row) => normalizePolymarketApiRow(row, row?.meta?.collector_source || 'breaking')).filter(Boolean)
      : [];
    const recentRows = Array.isArray(payload?.slices?.new)
      ? payload.slices.new.map((row) => normalizePolymarketApiRow(row, row?.meta?.collector_source || 'recent')).filter(Boolean)
      : [];

    if (!markets.length) {
      throw new Error(String(payload?.error || 'Polymarket proxy returned no markets'));
    }

    return {
      liveOk: true,
      fallbackUsed: false,
      sourceMode: 'live',
      sourceLabel: String(payload?.sourceLabel || 'Supabase Edge proxy'),
      fetchedAt: payload?.fetchedAt || fetchedAt,
      error: '',
      markets,
      slices: {
        trending: trendingRows,
        breaking: breakingRows,
        new: recentRows,
      },
    };
  } catch (err) {
    console.error('Polymarket live proxy fetch error:', err.message);
    return {
      liveOk: false,
      fallbackUsed: false,
      sourceMode: 'error',
      sourceLabel: 'Supabase Edge proxy unavailable',
      fetchedAt,
      error: err.message,
      markets: [],
      slices: {
        trending: [],
        breaking: [],
        new: [],
      },
    };
  }
}

async function fetchPolymarketLiveDetail(marketSlug) {
  const slug = String(marketSlug || '').trim();
  if (!slug) return null;
  try {
    const payload = await fetchPolymarketProxyJson({ detail_slug: slug });
    if (payload?.market) {
      const normalized = normalizePolymarketApiRow(payload.market, payload?.market?.meta?.collector_source || 'detail');
      if (normalized) return normalized;
    }
  } catch (err) {
    console.warn('Polymarket live detail fetch warning:', err.message);
  }
  return null;
}

async function fetchActiveSignal() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) return normalizeSignal(data[0]);

    // Fallback: show latest rejected decision when no active signal exists.
    const { data: rejectedData, error: rejectedError } = await supabaseClient
      .from('signals')
      .select('*')
      .eq('status', 'REJECTED')
      .order('created_at', { ascending: false })
      .limit(1);

    if (rejectedError) throw rejectedError;
    return rejectedData && rejectedData.length > 0 ? normalizeSignal(rejectedData[0]) : null;
  } catch (err) {
    console.error('Signal fetch error:', err.message);
    return null;
  }
}

async function fetchActiveSignalsByLane() {
  if (!supabaseClient) return {};
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    const out = {};
    (data || []).forEach((row) => {
      const lane = String(row.lane || 'intraday').toLowerCase();
      if (!out[lane]) out[lane] = normalizeSignal(row);
    });
    return out;
  } catch (err) {
    console.error('Active signals by lane fetch error:', err.message);
    return {};
  }
}

async function fetchLatestDecisionRun() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('signal_decision_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? normalizeDecisionRun(data[0]) : null;
  } catch (err) {
    console.error('Decision run fetch error:', err.message);
    return null;
  }
}

async function fetchLatestLaneHistory(lane = 'intraday', limit = 20) {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .eq('lane', lane)
      .neq('status', 'REJECTED')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(normalizeSignal);
  } catch (err) {
    console.error('Lane history fetch error:', err.message);
    return [];
  }
}

async function fetchSignalHistory(limit = 20) {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .neq('status', 'REJECTED')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(normalizeSignal);
  } catch (err) {
    console.error('History fetch error:', err.message);
    return [];
  }
}

async function fetchIndicatorSnapshot() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('indicator_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? normalizeSnapshot(data[0]) : null;
  } catch (err) {
    console.error('Indicator fetch error:', err.message);
    return null;
  }
}

async function fetchUpcomingEvents() {
  if (!supabaseClient) return [];
  try {
    const now = new Date().toISOString();
    const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseClient
      .from('economic_events')
      .select('*')
      .gte('event_date', now)
      .lte('event_date', weekAhead)
      .in('impact', ['HIGH', 'MEDIUM'])
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Events fetch error:', err.message);
    return [];
  }
}

async function fetchPerformanceStats() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .neq('status', 'REJECTED')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    const tradableRows = (data || []).filter((row) => normalizeSignalStatus(row.status) !== 'REJECTED');
    if (tradableRows.length === 0) return emptyPerformanceStats();

    const realizedStatuses = ['HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'BREAKEVEN', 'EXPIRED'];
    const realizedRows = tradableRows.filter((row) => realizedStatuses.includes(normalizeSignalStatus(row.status)));
    const winRows = realizedRows.filter((row) => isWinningSignalStatus(row.status));
    const lossRows = realizedRows.filter((row) => normalizeSignalStatus(row.status) === 'HIT_SL');

    const mapStatusR = (status) => {
      const normalized = normalizeSignalStatus(status);
      if (normalized === 'HIT_TP1') return 1.0;
      if (normalized === 'HIT_TP2') return 2.0;
      if (normalized === 'HIT_TP3') return 3.0;
      if (normalized === 'HIT_SL') return -1.0;
      if (normalized === 'BREAKEVEN') return 0.0;
      if (normalized === 'EXPIRED') return -0.2;
      return 0;
    };

    const calcMetrics = (rows) => {
      if (!rows || rows.length === 0) {
        return {
          count: 0,
          winRate: 0,
          expectancy: 0,
          avgRR: 0,
          drawdown: 0,
          tp1: 0,
          tp2: 0,
          tp3: 0,
          sl: 0,
        };
      }

      const tp1 = rows.filter((s) => ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(s.status)).length;
      const tp2 = rows.filter((s) => ['HIT_TP2', 'HIT_TP3'].includes(s.status)).length;
      const tp3 = rows.filter((s) => s.status === 'HIT_TP3').length;
      const sl = rows.filter((s) => s.status === 'HIT_SL').length;

      const rvals = rows.map((s) => mapStatusR(s.status));
      const expectancy = rvals.reduce((a, b) => a + b, 0) / rows.length;
      const avgRR = rvals.reduce((a, b) => a + b, 0) / rows.length;

      let equity = 0;
      let peak = 0;
      let maxDD = 0;
      rvals.forEach((r) => {
        equity += r;
        if (equity > peak) peak = equity;
        const dd = peak - equity;
        if (dd > maxDD) maxDD = dd;
      });

      return {
        count: rows.length,
        winRate: (tp1 / rows.length) * 100,
        expectancy,
        avgRR,
        drawdown: maxDD,
        tp1,
        tp2,
        tp3,
        sl,
      };
    };

    const byLane = (lane) => realizedRows.filter((s) => (s.lane || 'intraday') === lane);
    const intraday = calcMetrics(byLane('intraday'));
    const swing = calcMetrics(byLane('swing'));
    const overall = calcMetrics(realizedRows);

    const windowMetrics = {};
    [50, 100, 300].forEach((n) => {
      windowMetrics[n] = calcMetrics(realizedRows.slice(0, n));
    });

    let totalPips = 0;
    realizedRows.forEach((s) => {
      const entry = parseNumber(s.entry_price, NaN);
      const tp1 = parseNumber(s.tp1, NaN);
      const tp2 = parseNumber(s.tp2, NaN);
      const tp3 = parseNumber(s.tp3, NaN);
      const sl = parseNumber(s.stop_loss ?? s.sl, NaN);
      const status = String(s.status || '').toUpperCase();

      if (!Number.isFinite(entry)) return;

      let move = 0;
      if (status === 'HIT_TP1' && Number.isFinite(tp1)) move = Math.abs(tp1 - entry);
      if (status === 'HIT_TP2' && Number.isFinite(tp2)) move = Math.abs(tp2 - entry);
      if (status === 'HIT_TP3' && Number.isFinite(tp3)) move = Math.abs(tp3 - entry);
      if (status === 'HIT_SL' && Number.isFinite(sl)) move = -Math.abs(sl - entry);
      if (status === 'EXPIRED') move = 0;

      const pips = toXauPipsApi(move);
      if (Number.isFinite(pips)) totalPips += pips;
    });

    return {
      totalSignals: tradableRows.length,
      winCount: winRows.length,
      lossCount: lossRows.length,
      winRate: overall.winRate.toFixed(1),
      totalPips: totalPips.toFixed(1),
      expectancy: overall.expectancy.toFixed(2),
      avgRR: overall.avgRR.toFixed(2),
      drawdown: overall.drawdown.toFixed(2),
      tp1Hits: overall.tp1,
      tp2Hits: overall.tp2,
      tp3Hits: overall.tp3,
      slHits: overall.sl,
      laneStats: {
        intraday: {
          count: intraday.count,
          winRate: intraday.winRate.toFixed(1),
          expectancy: intraday.expectancy.toFixed(2),
          avgRR: intraday.avgRR.toFixed(2),
        },
        swing: {
          count: swing.count,
          winRate: swing.winRate.toFixed(1),
          expectancy: swing.expectancy.toFixed(2),
          avgRR: swing.avgRR.toFixed(2),
        },
      },
      windows: {
        w50: { expectancy: windowMetrics[50].expectancy.toFixed(2), winRate: windowMetrics[50].winRate.toFixed(1) },
        w100: { expectancy: windowMetrics[100].expectancy.toFixed(2), winRate: windowMetrics[100].winRate.toFixed(1) },
        w300: { expectancy: windowMetrics[300].expectancy.toFixed(2), winRate: windowMetrics[300].winRate.toFixed(1) },
      },
    };
  } catch (err) {
    console.error('Stats error:', err.message);
    return null;
  }
}

async function fetchSignalsByIds(signalIds = []) {
  if (!supabaseClient || !Array.isArray(signalIds) || signalIds.length === 0) return new Map();
  try {
    const uniqueIds = [...new Set(signalIds.filter(Boolean))];
    if (uniqueIds.length === 0) return new Map();

    const { data, error } = await supabaseClient
      .from('signals')
      .select('id,status,created_at,entry_price,sl,tp1,tp2,tp3,lane,type')
      .in('id', uniqueIds);

    if (error) throw error;
    return new Map((data || []).map((row) => [row.id, row]));
  } catch (err) {
    console.error('Signal status map fetch error:', err.message);
    return new Map();
  }
}

async function fetchDailyRiskState() {
  if (!supabaseClient) return null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseClient
      .from('risk_guard_state')
      .select('*')
      .eq('trade_date', today)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Risk state fetch error:', err.message);
    return null;
  }
}

async function ensureDemoAccount() {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const { data, error } = await supabaseClient.rpc('ensure_demo_account', { p_user_id: user.id });
    if (error) throw error;
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  } catch (err) {
    console.error('Ensure demo account error:', err.message);
    return null;
  }
}

async function fetchDemoAccount() {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const { data, error } = await supabaseClient
      .from('demo_accounts')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Demo account fetch error:', err.message);
    return null;
  }
}

async function fetchDemoTrades(limit = 30) {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user?.id) return [];

  try {
    const { data, error } = await supabaseClient
      .from('demo_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Demo trades fetch error:', err.message);
    return [];
  }
}

async function fetchDemoTradeEvents(limit = 120) {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user?.id) return [];

  try {
    const { data, error } = await supabaseClient
      .from('demo_trade_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Demo trade events fetch error:', err.message);
    return [];
  }
}

async function fetchDemoEquityCurve(limit = 220) {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user?.id) return [];

  try {
    const { data, error } = await supabaseClient
      .from('demo_equity_points')
      .select('ts,balance,equity')
      .eq('user_id', user.id)
      .order('ts', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Demo equity fetch error:', err.message);
    return [];
  }
}

async function setDemoAutoTrade(enabled) {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const { data, error } = await supabaseClient
      .from('demo_accounts')
      .update({ auto_trade_enabled: Boolean(enabled) })
      .eq('user_id', user.id)
      .select('*')
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Demo auto-trade update error:', err.message);
    return null;
  }
}

async function resetDemoAccount() {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const { data, error } = await supabaseClient.rpc('reset_demo_account', { p_user_id: user.id });
    if (error) throw error;
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  } catch (err) {
    console.error('Demo reset error:', err.message);
    return null;
  }
}

async function resetLiveState() {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const { data, error } = await supabaseClient.rpc('reset_live_demo_state', { p_user_id: user.id });
    if (error) throw error;
    const result = Array.isArray(data) ? (data[0] || null) : (data || null);
    if (result && result.ok === false) {
      throw new Error(result.reason === 'NO_ACTIVE_SIGNAL'
        ? 'No ACTIVE signal is available to keep, so nothing was deleted.'
        : 'Live state reset failed.');
    }
    return result;
  } catch (err) {
    console.error('Live state reset error:', err.message);
    throw err;
  }
}

async function fetchDemoPerformance() {
  const [account, trades, equityPoints, events] = await Promise.all([
    fetchDemoAccount(),
    fetchDemoTrades(250),
    fetchDemoEquityCurve(500),
    fetchDemoTradeEvents(250),
  ]);

  if (!account) return null;

  const signalMap = await fetchSignalsByIds((trades || []).map((trade) => trade.signal_id));
  const tradesWithSignals = (trades || []).map((trade) => {
    const signal = signalMap.get(trade.signal_id) || null;
    return {
      ...trade,
      signal,
      signal_status: signal?.status || null,
    };
  });

  return buildDemoPerformance(account, tradesWithSignals, equityPoints, events);
}

function rehydrateDemoPerformance(perf, livePrice = NaN) {
  if (!perf?.account) return perf;
  return buildDemoPerformance(
    perf.account,
    perf.trades || [],
    perf.equityPointsBase || perf.equityPoints || [],
    perf.events || [],
    livePrice,
  );
}

window.API = {
  initSupabase,
  signUpWithEmail,
  signInWithEmail,
  signOutAuth,
  getCurrentSession,
  ensureDemoAccount,
  fetchDemoAccount,
  fetchDemoTrades,
  fetchDemoTradeEvents,
  fetchDemoPerformance,
  fetchDemoEquityCurve,
  rehydrateDemoPerformance,
  setDemoAutoTrade,
  resetDemoAccount,
  resetLiveState,
  fetchLivePrice,
  fetchCandles,
  fetchChartCandles,
  fetchDXYPrice,
  fetchLatestBtcTick,
  fetchPolymarketMarkets,
  fetchPolymarketLiveMarkets,
  fetchPolymarketLiveDetail,
  fetchPolymarketMarketHistory,
  fetchLatestDecisionRun,
  fetchActiveSignalsByLane,
  fetchLatestLaneHistory,
  fetchActiveSignal,
  fetchSignalHistory,
  fetchIndicatorSnapshot,
  fetchUpcomingEvents,
  fetchPerformanceStats,
  fetchDailyRiskState,
};
