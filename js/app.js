/**
 * app.js - Main orchestration for the XAUUSD dashboard.
 */

let currentSignal = null;
let latestDecisionRun = null;
let currentSignalsByLane = { intraday: null, swing: null };
let lastSignalIdsByLane = { intraday: null, swing: null };
let pollingStarted = false;
let demoBootstrapped = false;
let lastXauPriceData = null;
let lastPolymarketBtc = null;
let lastPolymarketMarkets = [];
let lastPolymarketFeed = {
  markets: [],
  fallbackMarkets: [],
  slices: { trending: [], breaking: [], new: [] },
  liveOk: false,
  fallbackUsed: false,
  sourceMode: 'idle',
  sourceLabel: 'Waiting for live feed',
  fetchedAt: null,
  error: '',
};
let lastPolymarketHistoryFetch = { slug: '', ts: 0 };
let lastSignalHistory = [];
let lastIndicatorSnapshot = null;
let lastRiskState = null;
let lastDemoPerformance = null;
let polymarketPollInFlight = false;
window._lastPriceDirection = null;
window.__currentSignal = null;
const XAU_MARKET_REOPEN_SUNDAY_UTC_HOUR = 22;
const XAU_MARKET_CLOSE_FRIDAY_UTC_HOUR = 22;
const APP_XAU_PIP_SIZE = 0.1;

function hasUsablePolymarketFeed(feed) {
  return Boolean(feed && Array.isArray(feed.markets) && feed.markets.length);
}

function isXauMarketOpen(now = new Date()) {
  const weekday = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const reopenMinutes = XAU_MARKET_REOPEN_SUNDAY_UTC_HOUR * 60;
  const fridayCloseMinutes = XAU_MARKET_CLOSE_FRIDAY_UTC_HOUR * 60;

  if (weekday === 6) return false;
  if (weekday === 0) return totalMinutes >= reopenMinutes;
  if (weekday === 5) return totalMinutes < fridayCloseMinutes;
  return true;
}

function normalizeLane(lane) {
  return String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
}

function getSelectedLane() {
  const fromUi = typeof UI.getSelectedSignalLane === 'function' ? UI.getSelectedSignalLane() : null;
  return normalizeLane(fromUi || 'intraday');
}

function resolveSignalForLane(lane = getSelectedLane()) {
  const key = normalizeLane(lane);
  return currentSignalsByLane[key] || latestDecisionRun?.lanes?.[key] || null;
}

function renderSignalDashboard() {
  const selectedLane = getSelectedLane();
  const signal = resolveSignalForLane(selectedLane);
  currentSignal = signal;
  window.__currentSignal = signal;

  UI.renderSignalHero(latestDecisionRun, currentSignalsByLane, lastXauPriceData?.price);
  UI.renderLevels(signal, lastXauPriceData?.price);
  UI.renderConditions(latestDecisionRun, lastIndicatorSnapshot, selectedLane);
  UI.updateRiskCalc(signal, lastRiskState);

  if (window.Chart && window.Chart.isInitialized()) {
    window.Chart.drawSignalOverlay(signal);
  }
}

function deriveStatsFromHistory(signals) {
  if (!signals || signals.length === 0) return null;
  const normalizeStatus = (status) => String(status || '').toUpperCase();
  const statusR = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'HIT_TP1') return 1.0;
    if (normalized === 'HIT_TP2') return 2.0;
    if (normalized === 'HIT_TP3') return 3.0;
    if (normalized === 'HIT_SL') return -1.0;
    if (normalized === 'BREAKEVEN') return 0.0;
    if (normalized === 'EXPIRED') return -0.2;
    return 0;
  };
  const origStopDistance = (signal) => {
    const entry = Number(signal.entry_price);
    if (!Number.isFinite(entry)) return NaN;
    const conditions = signal.conditions_met && typeof signal.conditions_met === 'object' ? signal.conditions_met : {};
    const origSl = Number(conditions.orig_sl);
    if (Number.isFinite(origSl) && Math.abs(origSl - entry) > 1e-9) {
      return Math.abs(entry - origSl);
    }
    const rrValue = Number(signal.rr_value);
    const tp2 = Number(signal.tp2);
    if (Number.isFinite(rrValue) && rrValue > 0 && Number.isFinite(tp2)) {
      return Math.abs(tp2 - entry) / rrValue;
    }
    const sl = Number(signal.stop_loss ?? signal.sl);
    return Number.isFinite(sl) ? Math.abs(entry - sl) : NaN;
  };
  const realizedR = (signal) => {
    const stored = Number(signal.realized_r);
    if (Number.isFinite(stored)) return stored;
    const entry = Number(signal.entry_price);
    const exitPrice = Number(signal.exit_price);
    const stopDistance = origStopDistance(signal);
    const conditions = signal.conditions_met && typeof signal.conditions_met === 'object' ? signal.conditions_met : {};
    const side = String(signal.type || signal.signal_type || 'BUY').toUpperCase();
    if (Number.isFinite(entry) && Number.isFinite(exitPrice) && Number.isFinite(stopDistance) && stopDistance > 0) {
      const exitR = (side === 'SELL' ? entry - exitPrice : exitPrice - entry) / stopDistance;
      const tp1Applied = Boolean(conditions.tp1_be_applied || conditions.tp1_hit_at);
      if (!tp1Applied) return exitR;
      const tp1 = Number(signal.tp1);
      const tp1Fraction = Math.max(0.05, Math.min(0.95, Number(conditions.tp1_fraction) || 0.4));
      const tp1R = Number.isFinite(tp1) ? ((side === 'SELL' ? entry - tp1 : tp1 - entry) / stopDistance) : 0;
      return (tp1Fraction * tp1R) + ((1 - tp1Fraction) * exitR);
    }
    return statusR(signal.status);
  };
  const realizedPips = (signal) => {
    const stopDistance = origStopDistance(signal);
    const rValue = realizedR(signal);
    if (Number.isFinite(stopDistance) && stopDistance > 0 && Number.isFinite(rValue)) {
      return rValue * (stopDistance / APP_XAU_PIP_SIZE);
    }
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

    const tp1 = rows.filter((signal) => Boolean(signal.conditions_met?.tp1_hit_at) || ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(normalizeStatus(signal.status))).length;
    const tp2 = rows.filter((signal) => ['HIT_TP2', 'HIT_TP3'].includes(normalizeStatus(signal.status))).length;
    const tp3 = rows.filter((signal) => normalizeStatus(signal.status) === 'HIT_TP3').length;
    const rvals = rows.map((signal) => realizedR(signal));
    const positiveR = rvals.filter((value) => value > 0);
    const losses = rvals.filter((value) => value < 0).length;
    const expectancy = rvals.length ? (rvals.reduce((sum, value) => sum + value, 0) / rvals.length) : 0;
    const avgRR = positiveR.length ? (positiveR.reduce((sum, value) => sum + value, 0) / positiveR.length) : 0;

    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    rvals.forEach((value) => {
      equity += value;
      if (equity > peak) peak = equity;
      maxDrawdown = Math.max(maxDrawdown, peak - equity);
    });

    return {
      count: rows.length,
      winRate: rows.length ? (positiveR.length / rows.length) * 100 : 0,
      expectancy,
      avgRR,
      drawdown: maxDrawdown,
      tp1,
      tp2,
      tp3,
      sl: losses,
    };
  };

  const tradableSignals = signals.filter((signal) => normalizeStatus(signal.status) !== 'REJECTED');
  const closed = tradableSignals.filter((signal) => normalizeStatus(signal.status || 'ACTIVE') !== 'ACTIVE');
  const overall = calcMetrics(closed);
  const wins = closed.filter((signal) => realizedR(signal) > 0);
  const losses = closed.filter((signal) => realizedR(signal) < 0);
  const totalPips = closed.reduce((sum, signal) => sum + realizedPips(signal), 0);
  const byLane = (lane) => closed.filter((signal) => String(signal.lane || 'intraday').toLowerCase() === lane);
  const intraday = calcMetrics(byLane('intraday'));
  const swing = calcMetrics(byLane('swing'));
  const windows = {};
  [50, 100, 300].forEach((size) => {
    windows[`w${size}`] = calcMetrics(closed.slice(0, size));
  });

  return {
    totalSignals: tradableSignals.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: overall.winRate.toFixed(1),
    totalPips: totalPips.toFixed(1),
    expectancy: overall.expectancy.toFixed(2),
    avgRR: overall.avgRR.toFixed(2),
    drawdown: overall.drawdown.toFixed(2),
    tp1Hits: tradableSignals.filter((signal) => Boolean(signal.conditions_met?.tp1_hit_at) || ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(String(signal.status || '').toUpperCase())).length,
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
      w50: { expectancy: windows.w50.expectancy.toFixed(2), winRate: windows.w50.winRate.toFixed(1) },
      w100: { expectancy: windows.w100.expectancy.toFixed(2), winRate: windows.w100.winRate.toFixed(1) },
      w300: { expectancy: windows.w300.expectancy.toFixed(2), winRate: windows.w300.winRate.toFixed(1) },
    },
  };
}

function renderDemoDashboardFromCache() {
  if (!lastDemoPerformance) {
    UI.renderDemoDashboard(null, [], [], []);
    return;
  }

  const liveDemoPerformance = typeof API.rehydrateDemoPerformance === 'function'
    ? API.rehydrateDemoPerformance(lastDemoPerformance, lastXauPriceData?.price)
    : lastDemoPerformance;

  lastDemoPerformance = liveDemoPerformance;
  UI.renderDemoDashboard(
    liveDemoPerformance,
    liveDemoPerformance?.equityPoints || [],
    liveDemoPerformance?.trades || [],
    liveDemoPerformance?.events || [],
  );
}

function mergePolymarketDetailIntoFeed(feed, detailRow) {
  if (!detailRow || !detailRow.market_slug) return feed;
  const nextFeed = {
    ...(feed || {}),
    markets: Array.isArray(feed?.markets) ? feed.markets.slice() : [],
  };
  const existingIndex = nextFeed.markets.findIndex((row) => row?.market_slug === detailRow.market_slug);
  if (existingIndex >= 0) {
    nextFeed.markets.splice(existingIndex, 1, {
      ...nextFeed.markets[existingIndex],
      ...detailRow,
      meta: {
        ...(nextFeed.markets[existingIndex]?.meta || {}),
        ...(detailRow.meta || {}),
      },
    });
  } else {
    nextFeed.markets.unshift(detailRow);
  }
  return nextFeed;
}

function safeRenderPolymarketDashboard(context = 'render') {
  try {
    UI.renderPolymarketDashboard(lastPolymarketBtc, lastPolymarketFeed);
    return true;
  } catch (err) {
    console.error(`Polymarket ${context} render error:`, err?.message || err);
    if (typeof UI.renderPolymarketRenderFailure === 'function') {
      UI.renderPolymarketRenderFailure(err, context);
    }
    return false;
  }
}

async function refreshSelectedPolymarketHistory(force = false) {
  const slug = typeof UI.getSelectedPolymarketMarketSlug === 'function'
    ? UI.getSelectedPolymarketMarketSlug()
    : '';
  if (!slug || typeof UI.setPolymarketMarketHistory !== 'function') return;

  const now = Date.now();
  if (!force && lastPolymarketHistoryFetch.slug === slug && now - lastPolymarketHistoryFetch.ts < 3000) {
    return;
  }

  try {
    const rows = await API.fetchPolymarketMarketHistory(slug, 120);
    UI.setPolymarketMarketHistory(slug, rows);
    lastPolymarketHistoryFetch = { slug, ts: now };
    if (UI.getDashboardMode() === 'polymarket') {
      safeRenderPolymarketDashboard('history refresh');
    }
  } catch (err) {
    console.warn('Polymarket history refresh failed:', err?.message || err);
  }
}

async function boot() {
  console.log('XAUUSD dashboard booting...');

  UI.initTheme();
  UI.initTranslateToggle();
  UI.initNavigation();
  UI.initLearnPage();
  UI.initDashboardSwitch();
  UI.initPolymarketControls();
  UI.initChartTime();
  UI.updateSessionPill();

  window.addEventListener('xauradar:dashboard-mode', () => {
    const mode = UI.getDashboardMode();
    if (mode === 'polymarket') {
      try {
        safeRenderPolymarketDashboard('mode switch');
      } catch (err) {
        console.error('Polymarket mode switch render error:', err?.message || err);
      }
    } else if (lastXauPriceData) {
      UI.updateHeaderPrice(lastXauPriceData);
      renderSignalDashboard();
    }
  });

  window.addEventListener('xauradar:signal-lane-change', () => {
    renderSignalDashboard();
  });

  window.addEventListener('xauradar:polymarket-market-change', () => {
    refreshSelectedPolymarketHistory(true);
  });

  setInterval(UI.updateSessionPill, 30000);

  const sbOk = API.initSupabase();
  if (!sbOk) console.warn('Supabase not loaded; auth and DB features unavailable until SDK loads');

  const authUnavailableError = 'Auth is unavailable right now (Supabase SDK not loaded). Refresh page and disable script/ad blockers for this site.';
  UI.initAuthGate({
    onLogin: async (email, password) => {
      if (!sbOk) throw new Error(authUnavailableError);
      return API.signInWithEmail(email, password);
    },
    onSignup: async (email, password) => {
      if (!sbOk) throw new Error(authUnavailableError);
      return API.signUpWithEmail(email, password);
    },
    onLogout: async () => {
      if (!sbOk) return;
      await API.signOutAuth();
      demoBootstrapped = false;
    },
    onAuthenticated: () => handleAuthenticated(),
  });

  if (sbOk) {

    UI.initDemoControls({
      onToggleAutoTrade: async (enabled) => API.setDemoAutoTrade(enabled),
      onResetDemoAccount: async () => API.resetLiveState(),
      onRefresh: async () => pollSupabase(),
    });

    try {
      const session = await API.getCurrentSession();
      if (session?.user?.email) {
        UI.setAuthButtonUser(session.user.email);
        UI.setAuthGateVisible(false);
        await handleAuthenticated();
      } else {
        UI.setAuthButtonUser(null);
        UI.setAuthGateVisible(true);
      }
    } catch (err) {
      console.warn('Session check failed:', err.message);
      UI.setAuthGateVisible(true);
    }
  } else {
    UI.setAuthButtonUser(null);
    UI.setAuthGateVisible(true);
  }

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

async function handleAuthenticated() {
  if (!demoBootstrapped) {
    try {
      await API.ensureDemoAccount();
      demoBootstrapped = true;
    } catch (err) {
      console.warn('Demo account bootstrap failed:', err?.message || err);
    }
  }
  startPolling();
}

function startPolling() {
  if (pollingStarted) return;
  pollingStarted = true;

  pollPrice(true);
  pollSupabase();
  pollPolymarket();

  setInterval(pollPrice, 30000);
  setInterval(pollSupabase, 30000);
  setInterval(pollPolymarket, 3000);
}

async function pollPrice(force = false) {
  if (!force && !isXauMarketOpen()) return;
  const data = await API.fetchLivePrice();
  if (!data || data.price <= 0) return;

  lastXauPriceData = data;
  if (UI.getDashboardMode() === 'xau') {
    UI.updateHeaderPrice(data);
    renderSignalDashboard();
  }
  renderDemoDashboardFromCache();
  window._lastPriceDirection = data.direction;
}

async function pollPolymarket() {
  if (polymarketPollInFlight) return;
  polymarketPollInFlight = true;
  try {
    const selectedSlug = typeof UI.getSelectedPolymarketMarketSlug === 'function'
      ? UI.getSelectedPolymarketMarketSlug()
      : '';
    const [btcTick, liveFeed, fallbackMarkets] = await Promise.all([
      API.fetchLatestBtcTick(),
      API.fetchPolymarketLiveMarkets(),
      API.fetchPolymarketMarkets(),
    ]);
    lastPolymarketBtc = btcTick || lastPolymarketBtc || null;
    const cachedFallback = Array.isArray(fallbackMarkets) ? fallbackMarkets : [];
    const hasPreviousLive = hasUsablePolymarketFeed(lastPolymarketFeed);

    let nextFeed = {
      ...lastPolymarketFeed,
      ...(liveFeed || {}),
      fallbackMarkets: cachedFallback,
    };

    if (liveFeed?.liveOk && Array.isArray(liveFeed.markets) && liveFeed.markets.length) {
      nextFeed = {
        ...nextFeed,
        markets: liveFeed.markets,
        liveOk: true,
        fallbackUsed: false,
        sourceMode: String(liveFeed.sourceMode || 'live'),
        sourceLabel: String(liveFeed.sourceLabel || 'Supabase Edge proxy'),
      };
    } else if (hasPreviousLive) {
      nextFeed = {
        ...nextFeed,
        markets: lastPolymarketFeed.markets,
        slices: lastPolymarketFeed.slices,
        liveOk: false,
        fallbackUsed: false,
        sourceMode: 'stale',
        sourceLabel: String(lastPolymarketFeed.sourceLabel || 'Holding last live values'),
        error: liveFeed?.error || 'Polymarket live refresh failed',
        fetchedAt: lastPolymarketFeed.fetchedAt || liveFeed?.fetchedAt || new Date().toISOString(),
      };
    } else if (cachedFallback.length) {
      nextFeed = {
        ...nextFeed,
        markets: cachedFallback,
        liveOk: false,
        fallbackUsed: true,
        sourceMode: 'fallback',
        sourceLabel: 'Supabase cache fallback',
        error: liveFeed?.error || '',
        fetchedAt: liveFeed?.fetchedAt || cachedFallback[0]?.provider_ts || new Date().toISOString(),
      };
    } else {
      nextFeed = {
        ...nextFeed,
        liveOk: false,
        fallbackUsed: false,
        markets: [],
        slices: { trending: [], breaking: [], new: [] },
        sourceMode: 'error',
        sourceLabel: 'No live data yet',
        error: liveFeed?.error || 'Polymarket live refresh failed',
      };
    }

    if (selectedSlug && nextFeed.liveOk && typeof API.fetchPolymarketLiveDetail === 'function') {
      const liveDetail = await API.fetchPolymarketLiveDetail(selectedSlug);
      if (liveDetail) {
        nextFeed = mergePolymarketDetailIntoFeed(nextFeed, liveDetail);
      }
    }

    lastPolymarketFeed = nextFeed;
    lastPolymarketMarkets = Array.isArray(nextFeed.markets) ? nextFeed.markets : [];
    safeRenderPolymarketDashboard('poll');
    await refreshSelectedPolymarketHistory();
  } catch (err) {
    console.error('Polymarket poll error:', err.message);
    lastPolymarketFeed = {
      ...lastPolymarketFeed,
      liveOk: false,
      sourceMode: lastPolymarketFeed.markets?.length ? 'stale' : 'error',
      sourceLabel: lastPolymarketFeed.markets?.length ? 'Holding last live values' : 'No live data',
      error: err.message,
    };
  } finally {
    polymarketPollInFlight = false;
  }
}

async function pollSupabase() {
  try {
    const [decisionRun, activeSignalsByLane, history, snapshot, events, stats, riskState, demoPerformance] = await Promise.all([
      API.fetchLatestDecisionRun(),
      API.fetchActiveSignalsByLane(),
      API.fetchSignalHistory(30),
      API.fetchIndicatorSnapshot(),
      API.fetchUpcomingEvents(),
      API.fetchPerformanceStats(),
      API.fetchDailyRiskState(),
      API.fetchDemoPerformance(),
    ]);

    latestDecisionRun = decisionRun;
    currentSignalsByLane = {
      intraday: activeSignalsByLane?.intraday || null,
      swing: activeSignalsByLane?.swing || null,
    };
    lastSignalHistory = history || [];
    lastIndicatorSnapshot = snapshot;
    lastRiskState = riskState;
    lastDemoPerformance = demoPerformance;

    ['intraday', 'swing'].forEach((lane) => {
      const signal = currentSignalsByLane[lane];
      if (signal?.id) {
        if (lastSignalIdsByLane[lane] && lastSignalIdsByLane[lane] !== signal.id) {
          fireAlert(signal);
        }
        lastSignalIdsByLane[lane] = signal.id;
      }
    });

    renderSignalDashboard();

    UI.renderNewsBanner(events);
    UI.renderEvents(events);
    UI.renderHistory(history);
    UI.renderStats(stats || deriveStatsFromHistory(history));
    renderDemoDashboardFromCache();
  } catch (err) {
    console.error('Supabase poll error:', err.message);
  }
}

function fireAlert(signal) {
  const type = signal.signal_type || signal.type || 'WAIT';
  const conf = signal.confidence;

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = type === 'BUY' ? 880 : 440;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn('Audio alert unavailable', err?.message || err);
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`${type} Signal - XAUUSD`, {
      body: `Confidence: ${conf}% | Entry: $${signal.entry_price}`,
      tag: 'xau-signal',
    });
  }

  console.log(`New signal: ${type} @ ${signal.entry_price} (${conf}%)`);
}

document.addEventListener('DOMContentLoaded', boot);
