/**
 * ui.js - DOM rendering for XAU Radar dashboard.
 */

const APP_TIMEZONE = 'Asia/Kuala_Lumpur';
const APP_TZ_LABEL = 'MYT';
const THEME_KEY = 'xauradar_theme';

const MY_FULL_TIME_FMT = new Intl.DateTimeFormat('en-MY', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const MY_SHORT_TIME_FMT = new Intl.DateTimeFormat('en-MY', {
  timeZone: APP_TIMEZONE,
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMalaysiaTime(value, useShort = false) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const fmt = useShort ? MY_SHORT_TIME_FMT : MY_FULL_TIME_FMT;
  return `${fmt.format(date)} ${APP_TZ_LABEL}`;
}

function getTimePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const clock = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { hour, minute, clock };
}

function setTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = theme === 'light' ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', `Theme: ${theme}`);
  }

  if (window.Chart && window.Chart.isInitialized && window.Chart.isInitialized() && window.Chart.applyTheme) {
    window.Chart.applyTheme(theme);
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');
  setTheme(initial);

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      setTheme(next);
    });
  }
}

function setActivePage(target) {
  const pages = document.querySelectorAll('.page');
  pages.forEach((p) => p.classList.remove('active'));
  const page = document.getElementById(`page-${target}`);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((node) => {
    const isActive = node.dataset.page === target;
    node.classList.toggle('active', isActive);
  });

  if (target === 'chart' && window.Chart && !window.Chart.isInitialized()) {
    window.Chart.init();
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => setActivePage(item.dataset.page));
  });
}

function setAuthButtonUser(email) {
  const btn = document.getElementById('auth-logout-btn');
  if (!btn) return;
  if (email) {
    const short = email.length > 18 ? `${email.slice(0, 15)}...` : email;
    btn.textContent = short;
    btn.classList.add('auth-trigger--active');
    btn.setAttribute('title', email);
  } else {
    btn.textContent = 'Logout';
    btn.classList.remove('auth-trigger--active');
    btn.removeAttribute('title');
  }
}

function setAuthGateVisible(visible) {
  const gate = document.getElementById('auth-gate');
  const app = document.getElementById('app-shell');
  if (!gate || !app) return;

  if (visible) {
    gate.classList.remove('auth-gate--hidden');
    app.classList.add('app-shell--hidden');
  } else {
    gate.classList.add('auth-gate--hidden');
    app.classList.remove('app-shell--hidden');
  }
}

function initAuthGate({ onLogin, onSignup, onLogout, onAuthenticated }) {
  const loginTab = document.getElementById('auth-tab-login');
  const signupTab = document.getElementById('auth-tab-signup');
  const loginForm = document.getElementById('auth-login-form');
  const signupForm = document.getElementById('auth-signup-form');
  const feedback = document.getElementById('auth-feedback');
  const logoutBtn = document.getElementById('auth-logout-btn');
  const loginSubmit = document.getElementById('auth-login-submit');
  const signupSubmit = document.getElementById('auth-signup-submit');

  if (!loginTab || !signupTab || !loginForm || !signupForm || !feedback || !logoutBtn || !loginSubmit || !signupSubmit) {
    return;
  }

  const showTab = (tab) => {
    const loginActive = tab === 'login';
    loginTab.classList.toggle('active', loginActive);
    signupTab.classList.toggle('active', !loginActive);
    loginForm.classList.toggle('auth-form--hidden', !loginActive);
    signupForm.classList.toggle('auth-form--hidden', loginActive);
    feedback.textContent = '';
    feedback.className = 'auth-feedback';
  };

  loginTab.addEventListener('click', () => showTab('login'));
  signupTab.addEventListener('click', () => showTab('signup'));

  loginForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const email = (document.getElementById('auth-login-email')?.value || '').trim();
    const password = document.getElementById('auth-login-password')?.value || '';
    if (!email || !password) return;

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Logging in...';
    try {
      const data = await onLogin(email, password);
      const userEmail = data?.user?.email || data?.session?.user?.email || email;
      setAuthButtonUser(userEmail);
      setAuthGateVisible(false);
      if (onAuthenticated) onAuthenticated();
      feedback.textContent = '';
      loginForm.reset();
    } catch (err) {
      feedback.textContent = err?.message || 'Login failed.';
      feedback.className = 'auth-feedback auth-feedback--error';
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = 'Login';
    }
  });

  signupForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const email = (document.getElementById('auth-signup-email')?.value || '').trim();
    const password = document.getElementById('auth-signup-password')?.value || '';
    if (!email || password.length < 8) {
      feedback.textContent = 'Use a valid email and password (minimum 8 chars).';
      feedback.className = 'auth-feedback auth-feedback--error';
      return;
    }

    signupSubmit.disabled = true;
    signupSubmit.textContent = 'Creating...';
    try {
      const result = await onSignup(email, password);
      const userEmail = result?.session?.user?.email || email;
      setAuthButtonUser(userEmail);
      setAuthGateVisible(false);
      if (onAuthenticated) onAuthenticated();
      feedback.textContent = '';
      signupForm.reset();
    } catch (err) {
      feedback.textContent = err?.message || 'Sign up failed.';
      feedback.className = 'auth-feedback auth-feedback--error';
    } finally {
      signupSubmit.disabled = false;
      signupSubmit.textContent = 'Create account';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await onLogout();
      setAuthButtonUser(null);
      setAuthGateVisible(true);
    } catch (err) {
      console.error('Logout failed', err?.message || err);
    }
  });
}

function updateSessionPill() {
  const el = document.getElementById('session-pill');
  if (!el) return;

  const now = new Date();
  const myt = getTimePartsInTimezone(now, APP_TIMEZONE);
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const total = utcH * 60 + utcM;

  const sessions = [
    { name: 'Sydney', start: 21 * 60, end: 30 * 60, color: '#4f8cff' },
    { name: 'Tokyo', start: 0, end: 9 * 60, color: '#8b6eff' },
    { name: 'London', start: 7 * 60, end: 16 * 60, color: '#1fca77' },
    { name: 'New York', start: 12 * 60, end: 21 * 60, color: '#ef5d6c' },
  ];

  let active = null;
  for (const s of sessions) {
    const start = s.start % (24 * 60);
    const end = s.end % (24 * 60);
    const inside = start < end ? total >= start && total < end : total >= start || total < end;
    if (inside) {
      active = s;
      break;
    }
  }

  let text = `${myt.clock} ${APP_TZ_LABEL} | Market Closed`;
  if (active) {
    const end = active.end % (24 * 60);
    let left = end - total;
    if (left < 0) left += 24 * 60;
    const h = Math.floor(left / 60);
    const m = left % 60;
    text = `${myt.clock} ${APP_TZ_LABEL} | ${active.name} ${h}h ${m}m left`;
    el.style.background = `${active.color}20`;
    el.style.borderColor = `${active.color}55`;
    el.style.color = active.color;
  } else {
    el.style.background = '';
    el.style.borderColor = '';
    el.style.color = '';
  }

  el.textContent = text;

  const sideSession = document.getElementById('sidebar-session');
  if (sideSession) sideSession.textContent = active ? active.name : 'Closed';

  const pulseSession = document.getElementById('pulse-session-value');
  if (pulseSession) pulseSession.textContent = active ? `${active.name} Open` : 'Closed';
}

function updateHeaderPrice(priceData) {
  if (!priceData || !priceData.price) return;

  const priceEl = document.getElementById('header-price');
  const changeEl = document.getElementById('header-change');
  const statusEl = document.getElementById('connection-status');
  const sourceEl = document.getElementById('source-badge');

  if (priceEl) {
    priceEl.textContent = `$${priceData.price.toFixed(2)}`;
    priceEl.className = 'topbar__price';
    if (priceData.direction === 'up' || priceData.direction === 'down') {
      priceEl.classList.add(priceData.direction);
    } else {
      priceEl.classList.add('neutral');
    }
    priceEl.classList.add('price-bounce');
    setTimeout(() => priceEl.classList.remove('price-bounce'), 300);
  }

  const ts = Number(priceData.timestamp) || Date.now();
  const ageMin = Number.isFinite(priceData.ageMinutes)
    ? Math.max(0, Math.floor(priceData.ageMinutes))
    : Math.max(0, Math.floor((Date.now() - ts) / 60000));
  const ageText = ageMin < 1 ? 'now' : ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ago`;
  const source = (priceData.source || '').toUpperCase();

  if (changeEl) {
    const spread = Number.isFinite(priceData.spread) ? priceData.spread.toFixed(2) : '--';
    if (source === 'TD_LIVE') {
      changeEl.textContent = `Last tick: ${ageText} | Source: Twelve Data live | Spread: ${spread}`;
    } else if (source === 'TD_DELAYED') {
      changeEl.textContent = `Last tick: ${ageText} | Source: delayed plan`;
    } else if (source === 'STALE') {
      changeEl.textContent = `Last tick: ${ageText} | Source: stale cache`;
    } else {
      changeEl.textContent = `Last tick: ${ageText} | Source: unknown`;
    }
  }

  if (statusEl) {
    statusEl.innerHTML = '<span class="status-dot"></span>';
  }

  if (sourceEl) {
    const sourceMap = {
      TD_LIVE: { label: 'LIVE', cls: 'source-badge--quote' },
      TD_DELAYED: { label: 'DELAY', cls: 'source-badge--1m' },
      STALE: { label: 'STALE', cls: 'source-badge--prev' },
    };
    const mapped = sourceMap[source] || { label: '--', cls: 'source-badge--unknown' };
    sourceEl.textContent = `SRC: ${mapped.label}`;
    sourceEl.className = `source-badge ${mapped.cls}`;
    sourceEl.setAttribute('aria-label', `Price source: ${mapped.label}`);

    const sideSource = document.getElementById('sidebar-source');
    if (sideSource) sideSource.textContent = mapped.label;
    const pulseSource = document.getElementById('pulse-source-value');
    if (pulseSource) pulseSource.textContent = mapped.label;
  }
}

function renderSignalHero(signal) {
  const hero = document.getElementById('signal-hero');
  if (!hero) return;

  if (!signal) {
    hero.innerHTML = `
      <div class="signal-hero__badge waiting">Waiting for signal setup...</div>
      <div class="signal-hero__time">Price refresh: 3m | Signal bot: 5m</div>
    `;
    return;
  }

  const type = signal.signal_type || signal.type || 'WAIT';
  const conf = signal.confidence || 0;
  const confClass = conf >= 70 ? 'conf-high' : conf >= 50 ? 'conf-med' : 'conf-low';
  const time = formatMalaysiaTime(signal.created_at);
  const regime = signal.h1_regime || ((signal.adx_value || 0) >= 20 ? 'Trending' : 'Range');

  hero.innerHTML = `
    <div class="signal-hero__badge ${type.toLowerCase()}">${type}</div>
    <div class="signal-hero__conf">Confidence: <strong class="${confClass}">${conf}%</strong> | Regime: ${regime}</div>
    <div class="signal-hero__time">${time}</div>
  `;
}

function renderLevels(signal, currentPrice) {
  const container = document.getElementById('levels-row');
  if (!container || !signal) return;

  const entry = parseFloat(signal.entry_price) || 0;
  const tp1 = parseFloat(signal.tp1) || 0;
  const tp2 = parseFloat(signal.tp2) || 0;
  const tp3 = parseFloat(signal.tp3) || 0;
  const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;
  const price = currentPrice || entry;
  const signalType = signal.signal_type || signal.type;

  const dist = (target) => {
    if (!target || !price) return '';
    return `${Math.abs(target - price).toFixed(1)}p`;
  };

  const hitCheck = (target, isTp) => {
    if (!price || !target) return '';
    if (isTp && signalType === 'BUY' && price >= target) return ' hit';
    if (isTp && signalType === 'SELL' && price <= target) return ' hit';
    return '';
  };

  container.innerHTML = `
    <div class="level-item">
      <div class="level-item__label entry">Entry</div>
      <div class="level-item__price">${entry.toFixed(2)}</div>
    </div>
    <div class="level-item${hitCheck(tp1, true)}">
      <div class="level-item__label tp">TP1</div>
      <div class="level-item__price">${tp1.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp1)}</div>
    </div>
    <div class="level-item${hitCheck(tp2, true)}">
      <div class="level-item__label tp">TP2</div>
      <div class="level-item__price">${tp2.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp2)}</div>
    </div>
    <div class="level-item${hitCheck(tp3, true)}">
      <div class="level-item__label tp">TP3</div>
      <div class="level-item__price">${tp3.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp3)}</div>
    </div>
    <div class="level-item">
      <div class="level-item__label sl">SL</div>
      <div class="level-item__price">${sl.toFixed(2)}</div>
      <div class="level-item__dist">${dist(sl)}</div>
    </div>
  `;
}

function renderConditions(signal, snapshot) {
  const container = document.getElementById('conditions-row');
  if (!container) return;

  const renderRow = (label, items, tone = 'neutral') => `
    <div class="conditions-block conditions-block--${tone}">
      <div class="conditions-block__label">${label}</div>
      <div class="conditions-block__chips">
        ${items.map((item) => `<span class="cond-chip ${item.met ? 'met' : 'missed'}">${item.label}</span>`).join('')}
      </div>
    </div>
  `;

  const signalConditions = signal && signal.conditions_met && typeof signal.conditions_met === 'object'
    ? signal.conditions_met
    : null;

  const buildSignalItems = (conditions) => {
    const hasNewShape = (
      Object.prototype.hasOwnProperty.call(conditions, 'trend_filter')
      || Object.prototype.hasOwnProperty.call(conditions, 'macd_momentum')
      || Object.prototype.hasOwnProperty.call(conditions, 'volatility_quality')
    );

    const ordered = hasNewShape
      ? [
        { key: 'trend_filter', label: 'trend filter' },
        { key: 'pullback', label: 'pullback' },
        { key: 'macd_momentum', label: 'macd momentum' },
        { key: 'asian_range', label: 'asian range' },
        { key: 'volatility_quality', label: 'volatility+spread' },
      ]
      : [
        { key: 'stochrsi', label: 'stochrsi cross' },
        { key: 'pullback', label: 'pullback' },
        { key: 'macd', label: 'macd momentum' },
        { key: 'asian_range', label: 'asian range' },
        { key: 'keltner', label: 'keltner breakout' },
      ];

    return ordered.map((item) => {
      const met = Boolean(conditions[item.key]);
      return { label: item.label, met };
    });
  };

  const emptyItems = [
    { label: 'trend filter', met: false },
    { label: 'pullback', met: false },
    { label: 'macd momentum', met: false },
    { label: 'asian range', met: false },
    { label: 'volatility+spread', met: false },
  ];

  const buildPreviewItems = (side) => {
    if (!snapshot) return emptyItems;

    // Snapshot preview is directional guidance, not the final signal engine result.
    const adx = Number(snapshot.adx_value ?? snapshot.adx ?? 0);
    const stochK = Number(snapshot.stochrsi_k ?? 0);
    const stochD = Number(snapshot.stochrsi_d ?? 0);
    const macd = Number(snapshot.macd_value ?? snapshot.macd_histogram ?? 0);
    const atr = Number(snapshot.atr_value ?? snapshot.atr ?? 0);

    const isBuy = side === 'BUY';
    return [
      { met: adx >= 18, label: 'trend filter' },
      { met: isBuy ? (stochK > stochD && stochK >= 20 && stochK <= 80) : (stochK < stochD && stochK >= 20 && stochK <= 80), label: 'pullback' },
      { met: isBuy ? macd >= 0.2 : macd <= -0.2, label: 'macd momentum' },
      { met: false, label: 'asian range' },
      { met: atr > 0, label: 'volatility+spread' },
    ];
  };

  let buyItems = buildPreviewItems('BUY');
  let sellItems = buildPreviewItems('SELL');

  if (signalConditions) {
    const signalType = signal.signal_type || signal.type || '';
    const signalItems = buildSignalItems(signalConditions);
    if (signalType === 'BUY') {
      buyItems = signalItems;
    } else if (signalType === 'SELL') {
      sellItems = signalItems;
    }
  }

  container.innerHTML = `
    ${renderRow('BUY setup', buyItems, 'buy')}
    ${renderRow('SELL setup', sellItems, 'sell')}
  `;
}

function renderDXY(dxyData) {
  const widget = document.getElementById('dxy-widget');
  if (!widget) return;

  const priceEl = widget.querySelector('.dxy-row__price');
  const corrEl = widget.querySelector('.dxy-row__corr');

  if (!dxyData || !dxyData.price) {
    if (priceEl) priceEl.textContent = 'Unavailable';
    if (corrEl) {
      corrEl.textContent = 'Neutral (no DXY feed)';
      corrEl.className = 'dxy-row__corr neutral';
    }
    const pulseDxy = document.getElementById('pulse-dxy-value');
    if (pulseDxy) pulseDxy.textContent = 'Unavailable';
    return;
  }

  if (priceEl) priceEl.textContent = dxyData.price ? dxyData.price.toFixed(2) : '--';

  if (corrEl && dxyData.direction) {
    const xauDir = window._lastPriceDirection;
    if (dxyData.direction === 'DOWN' && xauDir === 'up') {
      corrEl.textContent = 'Confirms long';
      corrEl.className = 'dxy-row__corr confirms';
    } else if (dxyData.direction === 'UP' && xauDir === 'down') {
      corrEl.textContent = 'Confirms short';
      corrEl.className = 'dxy-row__corr confirms';
    } else {
      corrEl.textContent = 'Diverging';
      corrEl.className = 'dxy-row__corr diverges';
    }
  }

  const pulseDxy = document.getElementById('pulse-dxy-value');
  if (pulseDxy) pulseDxy.textContent = dxyData.price ? dxyData.price.toFixed(2) : '--';
}

function renderNewsBanner(events) {
  const banner = document.getElementById('news-banner');
  if (!banner) return;

  if (!events || events.length === 0) {
    banner.classList.remove('visible');
    return;
  }

  const nextHighUsd = events.find((e) => (e.currency || '').toUpperCase() === 'USD' && (e.impact || '').toUpperCase() === 'HIGH');
  if (!nextHighUsd) {
    banner.classList.remove('visible');
    return;
  }

  const next = nextHighUsd;
  const time = new Date(next.event_date);
  const diff = time.getTime() - Date.now();
  const mins = Math.floor(diff / 60000);

  if (mins > 0 && mins <= 120) {
    banner.classList.add('visible');
    const textEl = banner.querySelector('.news-banner__text');
    const timeEl = banner.querySelector('.news-banner__time');
    if (textEl) textEl.textContent = `${next.event_name} (${next.impact})`;
    if (timeEl) timeEl.textContent = mins <= 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else {
    banner.classList.remove('visible');
  }
}

function renderHistory(signals) {
  const container = document.getElementById('history-list');
  if (!container) return;

  if (!signals || signals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No signals yet</div>
        <div class="empty-state__sub">Signals will appear here when generated</div>
      </div>
    `;
    return;
  }

  container.innerHTML = signals.map((s) => {
    const type = s.signal_type || s.type || 'WAIT';
    const entry = parseFloat(s.entry_price) || 0;
    const conf = s.confidence || 0;
    const time = formatMalaysiaTime(s.created_at);
    const status = (s.status || 'ACTIVE').replace('_', ' ');

    let statusCls = 'active';
    if (status.includes('TP')) statusCls = 'hit-tp';
    if (status.includes('SL')) statusCls = 'hit-sl';
    if (status === 'EXPIRED') statusCls = 'expired';

    return `
      <div class="history-item">
        <div class="history-item__type ${type.toLowerCase()}">${type}</div>
        <div class="history-item__info">
          <div class="history-item__entry">$${entry.toFixed(2)}</div>
          <div class="history-item__meta">${time}</div>
        </div>
        <div class="history-item__right">
          <div class="history-item__status ${statusCls}">${status}</div>
          <div class="history-item__conf">${conf}% conf</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEvents(events) {
  const container = document.getElementById('events-list');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <div class="empty-state__sub">No upcoming events in the next 7 days</div>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map((e) => {
    const time = formatMalaysiaTime(e.event_date, true);
    const impact = (e.impact || '--').toUpperCase();
    const currency = (e.currency || '--').toUpperCase();
    return `
      <div class="history-item">
        <div class="history-item__info">
          <div class="history-item__entry">${e.event_name}</div>
          <div class="history-item__meta">${time} | ${currency}</div>
        </div>
        <div class="history-item__right">
          <div class="history-item__status ${impact === 'HIGH' ? 'hit-sl' : impact === 'MEDIUM' ? 'active' : 'expired'}">${impact}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderStats(stats) {
  if (!stats) return;

  const heroEl = document.getElementById('stats-hero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="stats-hero__winrate">${stats.winRate}%</div>
      <div class="stats-hero__label">Win Rate (${stats.totalSignals} signals)</div>
    `;
  }

  const gridEl = document.getElementById('stats-grid');
  if (gridEl) {
    gridEl.innerHTML = `
      <div class="stat-tile">
        <div class="stat-tile__label">Total Signals</div>
        <div class="stat-tile__value">${stats.totalSignals}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Total Pips</div>
        <div class="stat-tile__value" style="color:${parseFloat(stats.totalPips) >= 0 ? 'var(--green)' : 'var(--red)'}">${stats.totalPips}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">TP1 Hits</div>
        <div class="stat-tile__value">${stats.tp1Hits}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">SL Hits</div>
        <div class="stat-tile__value">${stats.slHits}</div>
      </div>
    `;
  }

  const tpEl = document.getElementById('tp-breakdown');
  if (tpEl) {
    tpEl.innerHTML = `
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp1"></div><div class="tp-bar-item__count">${stats.tp1Hits}</div><div class="tp-bar-item__label">TP1</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp2"></div><div class="tp-bar-item__count">${stats.tp2Hits}</div><div class="tp-bar-item__label">TP2</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp3"></div><div class="tp-bar-item__count">${stats.tp3Hits}</div><div class="tp-bar-item__label">TP3</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar sl"></div><div class="tp-bar-item__count">${stats.slHits}</div><div class="tp-bar-item__label">SL</div></div>
    `;
  }
}

function updateRiskCalc(signal) {
  const lotInput = document.getElementById('lot-input');
  if (!lotInput) return;

  const body = document.getElementById('risk-calc-body');
  if (!body) return;

  const setValues = () => {
    const vals = body.querySelectorAll('.risk-val__num');
    if (vals.length < 4) return;
    if (!lotInput._riskSignal) {
      vals.forEach((el) => {
        el.textContent = '--';
        el.className = 'risk-val__num text-muted';
      });
      return;
    }

    const signalData = lotInput._riskSignal;
    const lots = parseFloat(lotInput.value) || 0.01;
    const entry = parseFloat(signalData.entry_price) || 0;
    const sl = parseFloat(signalData.stop_loss ?? signalData.sl) || 0;
    const tp1 = parseFloat(signalData.tp1) || 0;
    const tp2 = parseFloat(signalData.tp2) || 0;
    const tp3 = parseFloat(signalData.tp3) || 0;
    const mult = lots * 100;

    vals[0].textContent = `-$${(Math.abs(entry - sl) * mult).toFixed(2)}`;
    vals[0].className = 'risk-val__num loss';
    vals[1].textContent = `+$${(Math.abs(tp1 - entry) * mult).toFixed(2)}`;
    vals[1].className = 'risk-val__num profit';
    vals[2].textContent = `+$${(Math.abs(tp2 - entry) * mult).toFixed(2)}`;
    vals[2].className = 'risk-val__num profit';
    vals[3].textContent = `+$${(Math.abs(tp3 - entry) * mult).toFixed(2)}`;
    vals[3].className = 'risk-val__num profit';
  };

  if (!lotInput._riskBound) {
    lotInput.addEventListener('input', setValues);
    lotInput._riskBound = true;
  }

  lotInput._riskSignal = signal || null;
  setValues();
}

window.UI = {
  initTheme,
  initNavigation,
  initAuthGate,
  setAuthGateVisible,
  setAuthButtonUser,
  updateSessionPill,
  updateHeaderPrice,
  renderSignalHero,
  renderLevels,
  renderConditions,
  renderDXY,
  renderNewsBanner,
  renderHistory,
  renderEvents,
  renderStats,
  updateRiskCalc,
};
