/**
 * app.js — Main orchestration for the XAUUSD dashboard.
 * Polling loops, audio alerts, browser notifications.
 */

// ── State ────────────────────────────────────────────────────
let currentSignal = null;
let lastSignalId = null;
window._lastPriceDirection = null;

// ── Init ─────────────────────────────────────────────────────

async function boot() {
  console.log('🚀 XAUUSD Dashboard booting...');

  // Setup navigation
  UI.initNavigation();
  UI.updateSessionPill();

  // Session clock update every 30s
  setInterval(UI.updateSessionPill, 30000);

  // Init Supabase
  const sbOk = API.initSupabase();
  if (!sbOk) console.warn('Supabase not loaded — running in price-only mode');

  // Start polling loops
  pollPrice();
  pollSupabase();

  // Lighter polls
  setInterval(pollPrice, 30000);       // Price every 30s (less API pressure)
  setInterval(pollSupabase, 30000);    // Supabase every 30s
  setInterval(pollDXY, 60000);         // DXY every 60s

  // Initial DXY
  pollDXY();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ── Price Polling ────────────────────────────────────────────

async function pollPrice() {
  const data = await API.fetchLivePrice();
  if (data && data.price > 0) {
    UI.updateHeaderPrice(data);
    window._lastPriceDirection = data.direction;

    // Update levels with live price
    if (currentSignal) {
      UI.renderLevels(currentSignal, data.price);
    }
  }
}

// ── Supabase Polling ─────────────────────────────────────────

async function pollSupabase() {
  try {
    // Fetch in parallel
    const [signal, history, snapshot, events, stats] = await Promise.all([
      API.fetchActiveSignal(),
      API.fetchSignalHistory(30),
      API.fetchIndicatorSnapshot(),
      API.fetchUpcomingEvents(),
      API.fetchPerformanceStats(),
    ]);

    // Signal
    currentSignal = signal;
    UI.renderSignalHero(signal);
    UI.renderLevels(signal);
    if (window.Chart && window.Chart.isInitialized()) {
      window.Chart.drawSignalOverlay(signal);
    }

    // New signal alert
    if (signal && signal.id !== lastSignalId) {
      if (lastSignalId !== null) {
        fireAlert(signal);
      }
      lastSignalId = signal.id;
      UI.updateRiskCalc(signal);
    }

    // Indicators & Conditions
    UI.renderConditions(signal, snapshot);
    UI.renderIndicators(snapshot);

    // News
    UI.renderNewsBanner(events);
    UI.renderEvents(events);

    // History
    UI.renderHistory(history);

    // Stats
    UI.renderStats(stats);

  } catch (err) {
    console.error('Supabase poll error:', err.message);
  }
}

// ── DXY Polling ──────────────────────────────────────────────

async function pollDXY() {
  const data = await API.fetchDXYPrice();
  UI.renderDXY(data);
}

// ── Alert System ─────────────────────────────────────────────

function fireAlert(signal) {
  const type = signal.signal_type || signal.type || 'WAIT';
  const conf = signal.confidence;

  // Audio beep
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
  } catch (e) {}

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`${type} Signal — XAUUSD`, {
      body: `Confidence: ${conf}% | Entry: $${signal.entry_price}`,
      icon: '📊',
      tag: 'xau-signal',
    });
  }

  console.log(`🔔 New signal: ${type} @ ${signal.entry_price} (${conf}%)`);
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);
