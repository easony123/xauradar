/**
 * app.js - Main orchestration for the XAUUSD dashboard.
 */

let currentSignal = null;
let lastSignalId = null;
let pollingStarted = false;
let demoBootstrapped = false;
let lastXauPriceData = null;
let lastPolymarketBtc = null;
let lastPolymarketMarkets = [];
window._lastPriceDirection = null;
window.__currentSignal = null;

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
      UI.renderPolymarketDashboard(lastPolymarketBtc, lastPolymarketMarkets);
    } else if (lastXauPriceData) {
      UI.updateHeaderPrice(lastXauPriceData);
    }
  });

  setInterval(UI.updateSessionPill, 30000);

  const sbOk = API.initSupabase();
  if (!sbOk) console.warn('Supabase not loaded; running in price-only mode');
  if (sbOk) {
    UI.initAuthGate({
      onLogin: async (email, password) => API.signInWithEmail(email, password),
      onSignup: async (email, password) => API.signUpWithEmail(email, password),
      onLogout: async () => {
        await API.signOutAuth();
        demoBootstrapped = false;
      },
      onAuthenticated: () => handleAuthenticated(),
    });

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

  pollPrice();
  pollSupabase();
  pollDXY();
  pollPolymarket();

  setInterval(pollPrice, 30000);
  setInterval(pollSupabase, 30000);
  setInterval(pollDXY, 60000);
  setInterval(pollPolymarket, 30000);
}

async function pollPrice() {
  const data = await API.fetchLivePrice();
  if (!data || data.price <= 0) return;

  lastXauPriceData = data;
  if (UI.getDashboardMode() === 'xau') {
    UI.updateHeaderPrice(data);
  }
  window._lastPriceDirection = data.direction;

  if (currentSignal) {
    UI.renderLevels(currentSignal, data.price);
  }
}

async function pollPolymarket() {
  try {
    const [btcTick, markets] = await Promise.all([
      API.fetchLatestBtcTick(),
      API.fetchPolymarketMarkets(),
    ]);
    lastPolymarketBtc = btcTick || null;
    lastPolymarketMarkets = Array.isArray(markets) ? markets : [];
    UI.renderPolymarketDashboard(lastPolymarketBtc, lastPolymarketMarkets);
  } catch (err) {
    console.error('Polymarket poll error:', err.message);
  }
}

async function pollSupabase() {
  try {
    const [signal, history, snapshot, events, stats, riskState, demoPerformance] = await Promise.all([
      API.fetchActiveSignal(),
      API.fetchSignalHistory(30),
      API.fetchIndicatorSnapshot(),
      API.fetchUpcomingEvents(),
      API.fetchPerformanceStats(),
      API.fetchDailyRiskState(),
      API.fetchDemoPerformance(),
    ]);

    currentSignal = signal;
    window.__currentSignal = signal;

    UI.renderSignalHero(signal);
    UI.renderLevels(signal);
    if (window.Chart && window.Chart.isInitialized()) {
      window.Chart.drawSignalOverlay(signal);
    }

    if (signal && signal.id !== lastSignalId) {
      if (lastSignalId !== null && String(signal.status || '').toUpperCase() === 'ACTIVE') {
        fireAlert(signal);
      }
      lastSignalId = signal.id;
      UI.updateRiskCalc(signal, riskState);
    }
    if (!signal) UI.updateRiskCalc(null, riskState);

    UI.renderConditions(signal, snapshot, history);
    UI.renderNewsBanner(events);
    UI.renderEvents(events);
    UI.renderHistory(history);
    UI.renderStats(stats || deriveStatsFromHistory(history));
    UI.renderDemoDashboard(demoPerformance, demoPerformance?.equityPoints || [], demoPerformance?.trades || []);
  } catch (err) {
    console.error('Supabase poll error:', err.message);
  }
}

async function pollDXY() {
  const data = await API.fetchDXYPrice();
  UI.renderDXY(data);
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
