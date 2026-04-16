/**
 * app.js - Main orchestration for the XAUUSD dashboard.
 */

let currentSignal = null;
let lastSignalId = null;
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
  UI.initNavigation();
  UI.updateSessionPill();

  setInterval(UI.updateSessionPill, 30000);

  const sbOk = API.initSupabase();
  if (!sbOk) console.warn('Supabase not loaded; running in price-only mode');
  if (sbOk) {
    UI.initAuthModal(async (email, password) => API.signUpWithEmail(email, password));
    try {
      const session = await API.getCurrentSession();
      UI.setAuthButtonUser(session?.user?.email || null);
    } catch (err) {
      console.warn('Session check failed:', err.message);
    }
  }

  pollPrice();
  pollSupabase();
  pollDXY();

  setInterval(pollPrice, 30000);
  setInterval(pollSupabase, 30000);
  setInterval(pollDXY, 60000);

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

async function pollPrice() {
  const data = await API.fetchLivePrice();
  if (!data || data.price <= 0) return;

  UI.updateHeaderPrice(data);
  window._lastPriceDirection = data.direction;

  if (currentSignal) {
    UI.renderLevels(currentSignal, data.price);
  }
}

async function pollSupabase() {
  try {
    const [signal, history, snapshot, events, stats] = await Promise.all([
      API.fetchActiveSignal(),
      API.fetchSignalHistory(30),
      API.fetchIndicatorSnapshot(),
      API.fetchUpcomingEvents(),
      API.fetchPerformanceStats(),
    ]);

    currentSignal = signal;
    window.__currentSignal = signal;

    UI.renderSignalHero(signal);
    UI.renderLevels(signal);
    if (window.Chart && window.Chart.isInitialized()) {
      window.Chart.drawSignalOverlay(signal);
    }

    if (signal && signal.id !== lastSignalId) {
      if (lastSignalId !== null) {
        fireAlert(signal);
      }
      lastSignalId = signal.id;
      UI.updateRiskCalc(signal);
    }

    UI.renderConditions(signal, snapshot);
    UI.renderNewsBanner(events);
    UI.renderEvents(events);
    UI.renderHistory(history);
    UI.renderStats(stats || deriveStatsFromHistory(history));
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
