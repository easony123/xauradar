/**
 * api.js - Data layer
 * Uses Supabase as the single browser-side data source.
 * Market prices are collected server-side and stored in `market_ticks`.
 */

// Supabase config
const SUPABASE_URL = 'https://autbjwirftpixizrrzhw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_A_gXMbmff2IFJbZX1wsKrA_sXz6jzkQ';

// State
let supabaseClient = null;
let lastPrice = null;
let priceDirection = null; // 'up' | 'down' | null
let lastLiveSnapshot = null;

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

function toMillis(value) {
  if (!value) return null;
  const d = new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
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
 */
function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
    return true;
  }
  console.warn('Supabase SDK not loaded');
  return false;
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
    if (Number.isFinite(prevPrice)) {
      priceDirection = price > prevPrice ? 'up' : price < prevPrice ? 'down' : null;
    } else if (lastPrice !== null) {
      priceDirection = price > lastPrice ? 'up' : price < lastPrice ? 'down' : null;
    }
    lastPrice = price;

    const ageMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    const stale = ageMin >= 15;

    const source = (row.source || 'STALE').toUpperCase();
    const snapshot = {
      price,
      bid,
      ask,
      direction: priceDirection,
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

window.API = {
  initSupabase,
  signUpWithEmail,
  signInWithEmail,
  signOutAuth,
  getCurrentSession,
  fetchLivePrice,
  fetchCandles,
  fetchChartCandles,
  fetchDXYPrice,
  fetchActiveSignal,
  fetchSignalHistory,
  fetchIndicatorSnapshot,
  fetchUpcomingEvents,
  fetchPerformanceStats,
};
