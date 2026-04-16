/**
 * api.js — Data layer
 * Handles Massive.com live price polling (15s) and Supabase data reads.
 */

// ── Config ───────────────────────────────────────────────────
const MASSIVE_API_KEY = '34FMvo_3DD6hL54apDwMKPXNk_aa86uv';
const MASSIVE_BASE = 'https://api.polygon.io';

// Supabase config
const SUPABASE_URL = 'https://autbjwirftpixizrrzhw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A_gXMbmff2IFJbZX1wsKrA_sXz6jzkQ';

// ── State ────────────────────────────────────────────────────
let supabaseClient = null;
let lastPrice = null;
let priceDirection = null; // 'up' | 'down' | null

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
async function fetchLivePrice() {
  try {
    const url = `${MASSIVE_BASE}/v2/aggs/ticker/C:XAUUSD/prev?adjusted=true&apiKey=${MASSIVE_API_KEY}`;
    const resp = await fetch(url);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    let price = 0;

    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      price = r.c || 0;
    }

    if (price === 0) {
      return null;
    }

    let bid = price;
    let ask = price;

    // Determine direction
    if (lastPrice !== null) {
      priceDirection = price > lastPrice ? 'up' : price < lastPrice ? 'down' : priceDirection;
    }
    lastPrice = price;

    return {
      price,
      bid,
      ask,
      direction: priceDirection,
      spread: ask - bid,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Price fetch error:', err.message);
    return null;
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
