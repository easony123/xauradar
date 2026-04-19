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
let polymarketPollInFlight = false;
window._lastPriceDirection = null;
window.__currentSignal = null;
const XAU_MARKET_REOPEN_SUNDAY_UTC_HOUR = 22;
const XAU_MARKET_CLOSE_FRIDAY_UTC_HOUR = 22;

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
  const closed = signals.filter((s) => (s.status || 'ACTIVE') !== 'ACTIVE');
  const tp1 = closed.filter((s) => ['HIT_TP1', 'HIT_TP2', 'HIT_TP3'].includes(s.status));
  const tp2 = closed.filter((s) => ['HIT_TP2', 'HIT_TP3'].includes(s.status));
  const tp3 = closed.filter((s) => s.status === 'HIT_TP3');
  const sl = closed.filter((s) => s.status === 'HIT_SL');
  const total = closed.length || 1;
  const winRate = ((tp1.length / total) * 100).toFixed(1);

  return {
    totalSignals: signals.length,
    winRate,
    totalPips: '0.0',
    tp1Hits: tp1.length,
    tp2Hits: tp2.length,
    tp3Hits: tp3.length,
    slHits: sl.length,
  };
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
      onResetDemoAccount: async () => API.resetDemoAccount(),
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
    UI.renderDemoDashboard(
      demoPerformance,
      demoPerformance?.equityPoints || [],
      demoPerformance?.trades || [],
      demoPerformance?.events || []
    );
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
