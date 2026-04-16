/**
 * api.js — Data layer
 * Handles Massive.com/Polygon live price polling and Supabase data reads.
 */

// ── Config ───────────────────────────────────────────────────
const MASSIVE_API_KEY = '34FMvo_3DD6hL54apDwMKPXNk_aa86uv';
const MASSIVE_BASE = 'https://api.polygon.io';
const XAU_QUOTE_PATH = '/v1/last_quote/currencies/XAU/USD';
const XAU_AGG_PREV_PATH = '/v2/aggs/ticker/C:XAUUSD/prev';

// Supabase config
const SUPABASE_URL = 'https://autbjwirftpixizrrzhw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A_gXMbmff2IFJbZX1wsKrA_sXz6jzkQ';

// ── State ────────────────────────────────────────────────────
let supabaseClient = null;
let lastPrice = null;
let priceDirection = null; // 'up' | 'down' | null
let lastLiveSnapshot = null;
let quoteEndpointDisabled = false;
let backoffUntilTs = 0;
let backoffMs = 0;

const BACKOFF_BASE_MS = 30 * 1000;
const BACKOFF_MAX_MS = 5 * 60 * 1000;

function setRateLimitBackoff() {
  backoffMs = backoffMs > 0 ? Math.min(backoffMs * 2, BACKOFF_MAX_MS) : BACKOFF_BASE_MS;
  backoffUntilTs = Date.now() + backoffMs;
  console.warn(`Rate-limited by API. Backing off for ${Math.round(backoffMs / 1000)}s.`);
}

function clearRateLimitBackoff() {
  backoffMs = 0;
  backoffUntilTs = 0;
}

function createHttpError(status, data, fallbackMessage = '') {
  const apiMessage = (data && (data.message || data.error)) || fallbackMessage || `HTTP ${status}`;
  const err = new Error(apiMessage);
  err.status = status;
  err.data = data || null;
  return err;
}

async function fetchJson(url) {
  const resp = await fetch(url);
  const text = await resp.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!resp.ok) {
    throw createHttpError(resp.status, data, `HTTP ${resp.status}`);
  }

  // Some APIs may return HTTP 200 with logical error payloads.
  if (data && data.status === 'ERROR') {
    throw createHttpError(resp.status, data, 'API status=ERROR');
  }

  return data;
}

function tryParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeSignal(signal) {
  if (!signal) return null;

  const signalType = signal.signal_type || signal.type || null;
  const stopLoss = signal.stop_loss ?? signal.sl ?? null;
  const conditions = tryParseJson(signal.conditions_met);

  return {
    ...signal,
    signal_type: signalType,
    type: signalType,
    stop_loss: stopLoss,
    sl: stopLoss,
    conditions_met: conditions,
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

/**
 * Initialize Supabase client.
 * Must be called after the CDN script loads.
 */
function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    return true;
  }
  console.warn('⚠️ Supabase SDK not loaded');
  return false;
}

// ── Massive.com API ──────────────────────────────────────────

/**
 * Fetch latest XAUUSD mid-price from Massive.com forex quotes.
 * Returns: { price, bid, ask, direction, timestamp }
 */
async function fetchLastQuotePrice() {
  const url = `${MASSIVE_BASE}${XAU_QUOTE_PATH}?apiKey=${MASSIVE_API_KEY}`;
  const data = await fetchJson(url);
  const last = data && data.last ? data.last : null;
  const bid = last && Number.isFinite(last.bid) ? last.bid : null;
  const ask = last && Number.isFinite(last.ask) ? last.ask : null;

  if (!bid || !ask || bid <= 0 || ask <= 0) {
    const status = data && data.status ? data.status : 'UNKNOWN';
    throw new Error(`Quote unavailable (${status})`);
  }

  return {
    price: (bid + ask) / 2,
    bid,
    ask,
    spread: ask - bid,
    timestamp: last.timestamp || Date.now(),
    source: 'quote',
    isDelayed: false,
    pair: data.symbol || 'XAU/USD',
  };
}

async function fetchPrevAggregatePrice() {
  const url = `${MASSIVE_BASE}${XAU_AGG_PREV_PATH}?adjusted=true&apiKey=${MASSIVE_API_KEY}`;
  const data = await fetchJson(url);
  if (!data.results || data.results.length === 0) {
    throw new Error('No aggregate data');
  }

  const r = data.results[0];
  const price = Number.isFinite(r.c) ? r.c : 0;
  if (!price) throw new Error('Invalid aggregate price');

  return {
    price,
    bid: price,
    ask: price,
    spread: 0,
    timestamp: r.t || Date.now(),
    source: 'agg_prev',
    isDelayed: true,
    pair: data.ticker || 'C:XAUUSD',
  };
}

async function fetchMinuteAggregatePrice() {
  const now = Date.now();
  const from = now - 45 * 60 * 1000; // smaller request window to reduce load
  const url = `${MASSIVE_BASE}/v2/aggs/ticker/C:XAUUSD/range/1/minute/${from}/${now}?adjusted=true&sort=asc&limit=45&apiKey=${MASSIVE_API_KEY}`;
  const data = await fetchJson(url);
  if (!data.results || data.results.length === 0) {
    throw new Error('No minute aggregate data');
  }

  const r = data.results[data.results.length - 1];
  const price = Number.isFinite(r.c) ? r.c : 0;
  if (!price) throw new Error('Invalid minute aggregate price');

  return {
    price,
    bid: price,
    ask: price,
    spread: 0,
    timestamp: r.t || Date.now(),
    source: 'agg_1m',
    isDelayed: true,
    pair: data.ticker || 'C:XAUUSD',
  };
}

async function fetchLivePrice() {
  try {
    if (Date.now() < backoffUntilTs) {
      return lastLiveSnapshot;
    }

    let live = null;

    if (!quoteEndpointDisabled) {
      try {
        live = await fetchLastQuotePrice();
      } catch (quoteErr) {
        if (quoteErr.status === 403) {
          quoteEndpointDisabled = true;
          console.warn('Quote endpoint not authorized for current plan. Switching to aggregate-only mode.');
        } else if (quoteErr.status === 429) {
          setRateLimitBackoff();
          return lastLiveSnapshot;
        }
      }
    }

    if (!live) {
      try {
        live = await fetchMinuteAggregatePrice();
      } catch (minuteErr) {
        if (minuteErr.status === 429) {
          setRateLimitBackoff();
          return lastLiveSnapshot;
        }
        live = await fetchPrevAggregatePrice();
      }
    }

    if (!live || !live.price) return null;
    clearRateLimitBackoff();

    // Determine direction
    if (lastPrice !== null) {
      priceDirection = live.price > lastPrice ? 'up' : live.price < lastPrice ? 'down' : priceDirection;
    }
    lastPrice = live.price;

    const snapshot = {
      price: live.price,
      bid: live.bid,
      ask: live.ask,
      direction: priceDirection,
      spread: live.spread,
      timestamp: live.timestamp,
      source: live.source,
      isDelayed: live.isDelayed,
      pair: live.pair,
    };
    lastLiveSnapshot = snapshot;
    return snapshot;
  } catch (err) {
    if (err && err.status === 429) {
      setRateLimitBackoff();
    }
    console.error('Price fetch error:', err.message);
    return lastLiveSnapshot;
  }
}

async function fetchLivePriceSnapshot() {
  return await fetchLivePrice();
}

/**
 * Fetch M15 OHLCV candles for the chart.
 * Returns array of { time, open, high, low, close }
 */
async function fetchCandles(bars = 100) {
  try {
    const now = Date.now();
    const from = now - bars * 15 * 60 * 1000 - 60 * 60 * 1000 * 24; // go back an extra day just in case of delays
    const url = `${MASSIVE_BASE}/v2/aggs/ticker/C:XAUUSD/range/15/minute/${from}/${now}?adjusted=true&sort=asc&limit=${bars}&apiKey=${MASSIVE_API_KEY}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (!data.results || data.results.length === 0) return [];

    return data.results.map((r) => ({
      time: Math.floor(r.t / 1000), // Unix seconds for Lightweight Charts
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v || 0,
    }));
  } catch (err) {
    console.error('Candle fetch error:', err.message);
    return [];
  }
}

/**
 * Fetch DXY price for the correlation widget.
 */
async function fetchDXYPrice() {
  try {
    const url = `${MASSIVE_BASE}/v2/aggs/ticker/C:DXY/prev?adjusted=true&apiKey=${MASSIVE_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();

    if (data.results && data.results.length > 0) {
      return {
        price: data.results[0].c,
        direction: data.results[0].c > data.results[0].o ? 'UP' : 'DOWN',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Supabase Reads ───────────────────────────────────────────

/**
 * Fetch the latest ACTIVE signal.
 */
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
    return data && data.length > 0 ? normalizeSignal(data[0]) : null;
  } catch (err) {
    console.error('Signal fetch error:', err.message);
    return null;
  }
}

/**
 * Fetch last N signals for history.
 */
async function fetchSignalHistory(limit = 20) {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(normalizeSignal);
  } catch (err) {
    console.error('History fetch error:', err.message);
    return [];
  }
}

/**
 * Fetch latest indicator snapshot.
 */
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

/**
 * Fetch upcoming economic events (next 24h).
 */
async function fetchUpcomingEvents() {
  if (!supabaseClient) return [];
  try {
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseClient
      .from('economic_events')
      .select('*')
      .gte('event_date', now)
      .lte('event_date', tomorrow)
      .eq('impact', 'HIGH')
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Events fetch error:', err.message);
    return [];
  }
}

/**
 * Compute performance stats from signal history.
 */
async function fetchPerformanceStats() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const closed = data.filter((s) => s.status !== 'ACTIVE');
    const tp1 = closed.filter((s) => ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(s.status));
    const tp2 = closed.filter((s) => ['HIT_TP2', 'HIT_TP3'].includes(s.status));
    const tp3 = closed.filter((s) => s.status === 'HIT_TP3');
    const sl = closed.filter((s) => s.status === 'HIT_SL');
    const wins = tp1.length;
    const total = closed.length || 1;

    // Estimate pips from ATR
    let totalPips = 0;
    closed.forEach((s) => {
      const atr = parseFloat(s.atr_value) || 10;
      if (s.status === 'HIT_TP1') totalPips += atr * 1.0;
      if (s.status === 'HIT_TP2') totalPips += atr * 2.0;
      if (s.status === 'HIT_TP3') totalPips += atr * 3.0;
      if (s.status === 'HIT_SL') totalPips -= atr * 1.5;
    });

    return {
      totalSignals: data.length,
      winRate: ((wins / total) * 100).toFixed(1),
      totalPips: totalPips.toFixed(1),
      tp1Hits: tp1.length,
      tp2Hits: tp2.length,
      tp3Hits: tp3.length,
      slHits: sl.length,
    };
  } catch (err) {
    console.error('Stats error:', err.message);
    return null;
  }
}

// ── Exports ──────────────────────────────────────────────────
window.API = {
  initSupabase,
  fetchLivePrice,
  fetchCandles,
  fetchDXYPrice,
  fetchActiveSignal,
  fetchSignalHistory,
  fetchIndicatorSnapshot,
  fetchUpcomingEvents,
  fetchPerformanceStats,
};
