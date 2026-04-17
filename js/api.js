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
const API_XAU_PIP_SIZE = 0.1;
const ALLOWED_POLY_CATEGORIES = ['trending', 'breaking', 'new', 'politics', 'finance', 'geopolitics', 'oil', 'xauusd'];

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

async function fetchPolymarketMarkets(limit = 500) {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('polymarket_markets')
      .select('*')
      .in('category', ALLOWED_POLY_CATEGORIES)
      .order('category', { ascending: true })
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
    }));
  } catch (err) {
    console.error('Polymarket markets fetch error:', err.message);
    return [];
  }
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

    const realizedStatuses = ['HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'BREAKEVEN', 'EXPIRED'];
    const realizedRows = data.filter((s) => realizedStatuses.includes(s.status));
    const rejectedRows = data.filter((s) => s.status === 'REJECTED');
    const executedRows = data.filter((s) => s.status !== 'REJECTED');

    const mapStatusR = (status) => {
      if (status === 'HIT_TP1') return 1.0;
      if (status === 'HIT_TP2') return 2.0;
      if (status === 'HIT_TP3') return 3.0;
      if (status === 'HIT_SL') return -1.0;
      if (status === 'BREAKEVEN') return 0.0;
      if (status === 'EXPIRED') return -0.2;
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
      totalSignals: data.length,
      executedCount: executedRows.length,
      rejectedCount: rejectedRows.length,
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

async function fetchDemoPerformance() {
  const [account, trades, equityPoints] = await Promise.all([
    fetchDemoAccount(),
    fetchDemoTrades(250),
    fetchDemoEquityCurve(500),
  ]);

  if (!account) return null;

  const starting = parseNumber(account.starting_capital, 100000);
  const balance = parseNumber(account.balance, starting);
  const equity = parseNumber(account.equity, balance);
  const openTrades = trades.filter((t) => String(t.status || '').toUpperCase() === 'OPEN');
  const closedTrades = trades.filter((t) => String(t.status || '').toUpperCase() !== 'OPEN');
  const wins = closedTrades.filter((t) => String(t.status || '').toUpperCase() === 'WIN');
  const losses = closedTrades.filter((t) => String(t.status || '').toUpperCase() === 'LOSS');

  const totalClosed = closedTrades.length;
  const winRate = totalClosed > 0 ? (wins.length / totalClosed) * 100 : 0;
  const pnlTotal = closedTrades.reduce((acc, t) => acc + parseNumber(t.pnl_usd, 0), 0);
  const roiPct = starting > 0 ? ((balance - starting) / starting) * 100 : 0;
  const expectancyR = totalClosed > 0
    ? closedTrades.reduce((acc, t) => acc + parseNumber(t.pnl_r, 0), 0) / totalClosed
    : 0;

  const points = [...equityPoints];
  if (points.length === 0 || parseNumber(points[points.length - 1]?.equity, NaN) !== equity) {
    points.push({
      ts: new Date().toISOString(),
      equity,
      balance,
    });
  }
  let peak = starting;
  let maxDrawdownPct = 0;
  points.forEach((p) => {
    const e = parseNumber(p.equity, 0);
    if (e > peak) peak = e;
    if (peak > 0) {
      const ddPct = ((peak - e) / peak) * 100;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
    }
  });

  const laneStats = ['intraday', 'swing'].reduce((out, lane) => {
    const rows = closedTrades.filter((t) => String(t.lane || 'intraday').toLowerCase() === lane);
    const laneWins = rows.filter((t) => String(t.status || '').toUpperCase() === 'WIN').length;
    out[lane] = {
      trades: rows.length,
      winRate: rows.length > 0 ? (laneWins / rows.length) * 100 : 0,
      pnl: rows.reduce((acc, t) => acc + parseNumber(t.pnl_usd, 0), 0),
    };
    return out;
  }, {});

  return {
    account,
    balance,
    equity,
    starting,
    roiPct,
    openTrades: openTrades.length,
    totalClosed,
    wins: wins.length,
    losses: losses.length,
    winRate,
    pnlTotal,
    expectancyR,
    maxDrawdownPct,
    laneStats,
    equityPoints: points,
    trades,
  };
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
  fetchDemoPerformance,
  fetchDemoEquityCurve,
  setDemoAutoTrade,
  resetDemoAccount,
  fetchLivePrice,
  fetchCandles,
  fetchChartCandles,
  fetchDXYPrice,
  fetchLatestBtcTick,
  fetchPolymarketMarkets,
  fetchActiveSignal,
  fetchSignalHistory,
  fetchIndicatorSnapshot,
  fetchUpcomingEvents,
  fetchPerformanceStats,
  fetchDailyRiskState,
};
