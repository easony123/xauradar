/**
 * ui.js - DOM rendering for XAU Radar dashboard.
 */

const APP_TIMEZONE = 'Asia/Kuala_Lumpur';
const APP_TZ_LABEL = 'MYT';
const THEME_KEY = 'xauradar_theme';
const XAU_PIP_SIZE = 0.1;
const LANG_KEY = 'xauradar_lang';
const DASHBOARD_MODE_KEY = 'xauradar_dashboard_mode';
const SIGNAL_LANE_KEY = 'xauradar_signal_lane';
const POLY_CATEGORY_KEY = 'xauradar_poly_category';
const POLY_SORT_KEY = 'xauradar_poly_sort';
const POLY_VIEW_KEY = 'xauradar_poly_view';
const POLY_BET_TYPE_KEY = 'xauradar_poly_bet_type';

let activeDashboardMode = 'xau';
let lastXauPage = 'signal';
const polymarketState = {
  btcTick: null,
  markets: [],
  category: 'all',
  query: '',
  sort: 'volume',
  view: 'all',
  betType: 'all',
};
const POLY_CATEGORIES = ['all', 'trending', 'breaking', 'new', 'politics', 'finance', 'geopolitics', 'oil', 'xauusd'];
const POLY_SORT_OPTIONS = ['volume', 'liquidity', 'ending', 'probability'];
const POLY_VIEW_OPTIONS = ['all', 'active', 'ending', 'resolved'];
const POLY_BET_TYPE_OPTIONS = ['all', 'up_down', 'above_below', 'price_range', 'hit_price'];
const POLY_LABELS = {
  all: 'All',
  trending: 'Trending',
  breaking: 'Breaking',
  new: 'New',
  politics: 'Politics',
  finance: 'Finance',
  oil: 'Oil',
  geopolitics: 'Geopolitics',
  xauusd: 'XAUUSD',
};

function getSelectedSignalLane() {
  return String(localStorage.getItem(SIGNAL_LANE_KEY) || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
}

function setSelectedSignalLane(lane, emit = true) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  localStorage.setItem(SIGNAL_LANE_KEY, normalized);
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:signal-lane-change', { detail: { lane: normalized } }));
  }
  return normalized;
}

function toXauPips(priceDelta) {
  const delta = Number(priceDelta);
  if (!Number.isFinite(delta)) return NaN;
  const pipSize = Number.isFinite(XAU_PIP_SIZE) && XAU_PIP_SIZE > 0 ? XAU_PIP_SIZE : 0.1;
  return delta / pipSize;
}

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

function setActivePage(target, opts = {}) {
  const force = Boolean(opts.force);
  if (activeDashboardMode === 'polymarket' && target !== 'polymarket' && !force) {
    target = 'polymarket';
  }
  if (target !== 'polymarket') {
    lastXauPage = target;
  }

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCompactUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  if (Math.abs(n) >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function getHoursUntil(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return (ts - Date.now()) / 3600000;
}

function updateDashboardTopbar(mode) {
  const assetLabel = document.getElementById('topbar-asset-label');
  const assetSub = document.getElementById('topbar-asset-sub');
  const modeBadge = document.getElementById('dashboard-mode-badge');
  const sourceBadge = document.getElementById('source-badge');
  const sessionPill = document.getElementById('session-pill');
  const status = document.getElementById('connection-status');

  if (assetLabel) assetLabel.textContent = mode === 'polymarket' ? 'Polymarket' : 'XAU/USD';
  if (assetSub) assetSub.textContent = mode === 'polymarket' ? 'Crypto + event probabilities' : 'Live market dashboard';

  if (modeBadge) {
    modeBadge.textContent = mode === 'polymarket' ? 'POLYMARKET' : 'XAU RADAR';
    modeBadge.className = `mode-badge ${mode === 'polymarket' ? 'mode-badge--polymarket' : 'mode-badge--xau'}`;
  }

  const hideXauMeta = mode === 'polymarket';
  if (sourceBadge) sourceBadge.style.display = hideXauMeta ? 'none' : '';
  if (sessionPill) sessionPill.style.display = hideXauMeta ? 'none' : '';
  if (status) status.style.display = hideXauMeta ? 'none' : '';
}

function closeDashboardSwitchMenu() {
  const btn = document.getElementById('dashboard-switch-btn');
  const menu = document.getElementById('dashboard-switch-menu');
  if (!btn || !menu) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
}

function setDashboardMode(mode, opts = {}) {
  const persist = opts.persist !== false;
  activeDashboardMode = mode === 'polymarket' ? 'polymarket' : 'xau';

  const appShell = document.getElementById('app-shell');
  if (appShell) appShell.classList.toggle('app-shell--polymarket', activeDashboardMode === 'polymarket');

  if (persist) localStorage.setItem(DASHBOARD_MODE_KEY, activeDashboardMode);
  updateDashboardTopbar(activeDashboardMode);

  const optionNodes = document.querySelectorAll('.dashboard-switch-option');
  optionNodes.forEach((node) => {
    const isActive = node.dataset.mode === activeDashboardMode;
    node.classList.toggle('active', isActive);
    node.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (activeDashboardMode === 'polymarket') {
    setActivePage('polymarket', { force: true });
  } else {
    setActivePage(lastXauPage || 'signal', { force: true });
  }

  window.dispatchEvent(new CustomEvent('xauradar:dashboard-mode', { detail: { mode: activeDashboardMode } }));
}

function initDashboardSwitch() {
  const btn = document.getElementById('dashboard-switch-btn');
  const menu = document.getElementById('dashboard-switch-menu');
  if (!btn || !menu) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');

  const saved = localStorage.getItem(DASHBOARD_MODE_KEY);
  setDashboardMode(saved === 'polymarket' ? 'polymarket' : 'xau', { persist: false });

  btn.addEventListener('click', (evt) => {
    evt.stopPropagation();
    const next = menu.hidden;
    menu.hidden = !next;
    btn.setAttribute('aria-expanded', next ? 'true' : 'false');
  });

  menu.querySelectorAll('.dashboard-switch-option').forEach((item) => {
    item.addEventListener('click', () => {
      setDashboardMode(item.dataset.mode || 'xau');
      closeDashboardSwitchMenu();
    });
  });

  document.addEventListener('click', (evt) => {
    if (menu.hidden) return;
    if (menu.contains(evt.target) || btn.contains(evt.target)) return;
    closeDashboardSwitchMenu();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') closeDashboardSwitchMenu();
  });
}

function getDashboardMode() {
  return activeDashboardMode;
}

function normalizePolymarketCategory(rawCategory, titleText = '', meta = null) {
  const metaDisplay = String(meta?.display_category || meta?.displayCategory || '').trim().toLowerCase();
  if (POLY_CATEGORIES.includes(metaDisplay) && metaDisplay !== 'all') return metaDisplay;

  const value = String(rawCategory || '').trim().toLowerCase();
  if (POLY_CATEGORIES.includes(value) && value !== 'all') return value;

  const rawSource = String(meta?.raw_category || meta?.rawCategory || value || '').toLowerCase();
  const text = `${metaDisplay} ${rawSource} ${value} ${String(titleText || '').toLowerCase()}`;
  if (/(trending|trend)/.test(text)) return 'trending';
  if (/(breaking|urgent|headline|flash|developing)/.test(text)) return 'breaking';
  if (/(new|fresh|latest|launched|launch)/.test(text)) return 'new';
  if (/(xauusd|xau|spot gold|gold price|bullion|precious metal)/.test(text)) return 'xauusd';
  if (/(oil|wti|brent|crude|opec|energy)/.test(text)) return 'oil';
  if (/(politics|election|president|senate|congress|minister|party|government|white house|parliament|trump|biden|campaign|vote|voting)/.test(text)) return 'politics';
  if (/(war|geopolitic|geopolitics|conflict|russia|ukraine|china|taiwan|israel|middle east|iran|sanction|ceasefire|military|nato|putin|xi jinping|gaza|hezbollah)/.test(text)) return 'geopolitics';
  if (/(fomc|fed|powell|rate|cpi|inflation|nfp|jobs|yield|treasury|tariff|economy|recession|gdp|finance|financial|stocks|nasdaq|s&p|dow|bond|dollar|usd|bitcoin|btc|ethereum|eth|solana|crypto|token|coin|doge|memecoin|altcoin|defi|etf)/.test(text)) return 'finance';
  return 'other';
}

function classifyBetType(titleText = '') {
  const t = String(titleText || '').toLowerCase();
  if (/(up or down|up\/down|\bup\b.*\bdown\b|\bdown\b.*\bup\b)/.test(t)) return 'up_down';
  if (/(above|below|over|under)/.test(t)) return 'above_below';
  if (/(range|between|from .* to|price band)/.test(t)) return 'price_range';
  if (/(hit|reach|touch)/.test(t)) return 'hit_price';
  return 'all';
}

function normalizePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  if (n >= 0 && n <= 1) return n * 100;
  return n;
}

function clamp01To100(value) {
  if (!Number.isFinite(value)) return NaN;
  return Math.max(0, Math.min(100, value));
}

function normalizePolymarketRow(row) {
  const title = String(row?.title || row?.question || 'Untitled market');
  const meta = row?.meta && typeof row.meta === 'object' ? row.meta : null;
  const category = normalizePolymarketCategory(row?.category, title, meta);
  const marketType = classifyBetType(title);
  const probability = clamp01To100(normalizePercent(row?.probability));

  let yesPct = clamp01To100(normalizePercent(row?.yes_price));
  let noPct = clamp01To100(normalizePercent(row?.no_price));
  if (!Number.isFinite(yesPct) && Number.isFinite(probability)) yesPct = probability;
  if (!Number.isFinite(noPct) && Number.isFinite(yesPct)) noPct = 100 - yesPct;
  if (!Number.isFinite(yesPct) && Number.isFinite(noPct)) yesPct = 100 - noPct;
  yesPct = clamp01To100(yesPct);
  noPct = clamp01To100(noPct);

  const volume = Number(row?.volume);
  const liquidity = Number(row?.liquidity);
  const status = String(row?.status || 'active').trim().toLowerCase();
  const endDate = row?.end_date || row?.end_at || row?.close_time || null;
  const hoursUntil = getHoursUntil(endDate);

  return {
    ...row,
    title,
    category,
    rawCategory: String(meta?.raw_category || row?.category || 'other').trim().toLowerCase() || 'other',
    marketType,
    probability,
    yesPct,
    noPct,
    volume: Number.isFinite(volume) ? volume : NaN,
    liquidity: Number.isFinite(liquidity) ? liquidity : NaN,
    status,
    endDate,
    hoursUntil,
  };
}

function setPolymarketCategory(category, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_CATEGORIES.includes(category) ? category : 'all';
  polymarketState.category = next;
  if (persist) localStorage.setItem(POLY_CATEGORY_KEY, next);
}

function setPolymarketSort(sortValue, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_SORT_OPTIONS.includes(sortValue) ? sortValue : 'volume';
  polymarketState.sort = next;
  if (persist) localStorage.setItem(POLY_SORT_KEY, next);
}

function setPolymarketView(viewValue, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_VIEW_OPTIONS.includes(viewValue) ? viewValue : 'all';
  polymarketState.view = next;
  if (persist) localStorage.setItem(POLY_VIEW_KEY, next);
}

function setPolymarketBetType(value, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_BET_TYPE_OPTIONS.includes(value) ? value : 'all';
  polymarketState.betType = next;
  if (persist) localStorage.setItem(POLY_BET_TYPE_KEY, next);
}

function initPolymarketControls() {
  const tabs = Array.from(document.querySelectorAll('#polymarket-tabs .poly-tab'));
  const betTabs = Array.from(document.querySelectorAll('#polymarket-bet-tabs .poly-bet-tab'));
  const viewTabs = Array.from(document.querySelectorAll('#polymarket-view-nav .poly-view-tab'));
  const searchInput = document.getElementById('polymarket-search');
  const sortSelect = document.getElementById('polymarket-sort');

  const savedCategory = localStorage.getItem(POLY_CATEGORY_KEY);
  const savedSort = localStorage.getItem(POLY_SORT_KEY);
  const savedView = localStorage.getItem(POLY_VIEW_KEY);
  const savedBetType = localStorage.getItem(POLY_BET_TYPE_KEY);
  setPolymarketCategory(savedCategory || 'all', { persist: false });
  setPolymarketSort(savedSort || 'volume', { persist: false });
  setPolymarketView(savedView || 'all', { persist: false });
  setPolymarketBetType(savedBetType || 'all', { persist: false });

  if (sortSelect) sortSelect.value = polymarketState.sort;

  tabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const category = String(btn.dataset.category || 'all').toLowerCase();
        setPolymarketCategory(category);
        renderPolymarketDashboard();
      });
    }
  });

  betTabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const value = String(btn.dataset.betType || 'all').toLowerCase();
        setPolymarketBetType(value);
        renderPolymarketDashboard();
      });
    }
  });

  viewTabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const view = String(btn.dataset.view || 'all').toLowerCase();
        setPolymarketView(view);
        renderPolymarketDashboard();
      });
    }
  });

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = '1';
    searchInput.addEventListener('input', () => {
      polymarketState.query = String(searchInput.value || '').trim().toLowerCase();
      renderPolymarketDashboard();
    });
  }

  if (sortSelect && !sortSelect.dataset.bound) {
    sortSelect.dataset.bound = '1';
    sortSelect.addEventListener('change', () => {
      setPolymarketSort(sortSelect.value);
      renderPolymarketDashboard();
    });
  }

  renderPolymarketDashboard();
}

function getCurrentGoogTrans() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function setGoogTransCookie(value) {
  document.cookie = `googtrans=${value};path=/`;
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    document.cookie = `googtrans=${value};path=/;domain=${host}`;
  }
}

function applyTranslateToggleLabel(btn, lang) {
  if (!btn) return;
  btn.textContent = lang === 'zh-CN' ? 'EN' : 'ä¸­æ–‡';
  btn.setAttribute('aria-label', lang === 'zh-CN' ? 'Switch language to English' : 'Switch language to Chinese');
}

function initTranslateToggle() {
  const btn = document.getElementById('translate-toggle');
  if (!btn) return;

  let lang = 'en';
  const saved = localStorage.getItem(LANG_KEY);
  const cookie = getCurrentGoogTrans();
  if (saved === 'zh-CN' || cookie.includes('/zh-CN')) {
    lang = 'zh-CN';
  }
  applyTranslateToggleLabel(btn, lang);

  btn.addEventListener('click', () => {
    const next = lang === 'zh-CN' ? 'en' : 'zh-CN';
    localStorage.setItem(LANG_KEY, next);
    setGoogTransCookie(next === 'zh-CN' ? '/en/zh-CN' : '/en/en');
    window.location.reload();
  });
}

function initChartTime() {
  const el = document.getElementById('chart-current-time');
  if (!el) return;
  const tick = () => {
    const nowText = formatMalaysiaTime(new Date(), true);
    el.textContent = `Now: ${nowText}`;
  };
  tick();
  setInterval(tick, 1000);
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
  const delta = Number(priceData.changeValue);
  const deltaPct = Number(priceData.changePct);
  const hasDelta = Number.isFinite(delta) && Number.isFinite(deltaPct);
  const deltaPips = hasDelta ? toXauPips(delta) : NaN;
  const deltaSign = hasDelta ? (delta > 0 ? '+' : delta < 0 ? '-' : '') : '';
  const deltaIcon = hasDelta ? (delta > 0 ? '▲' : delta < 0 ? '▼' : '•') : '•';
  const deltaClass = hasDelta ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') : 'flat';
  const deltaText = hasDelta
    ? `${deltaIcon} ${deltaSign}${Math.abs(delta).toFixed(2)} (${deltaSign}${Math.abs(deltaPct).toFixed(3)}%) | ${deltaSign}${Math.abs(deltaPips).toFixed(1)}p`
    : 'Δ --';

  if (changeEl) {
    const freshness = source === 'TD_DELAYED'
      ? `Last tick: ${ageText} | delayed`
      : source === 'STALE'
        ? `Last tick: ${ageText} | stale`
        : `Last tick: ${ageText}`;
    changeEl.innerHTML = `<span class="topbar__delta ${deltaClass}">${deltaText}</span> <span class="topbar__fresh">${freshness}</span>`;
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
    sourceEl.textContent = mapped.label;
    sourceEl.className = `source-badge ${mapped.cls}`;
    sourceEl.setAttribute('aria-label', `Price source: ${mapped.label}`);

    const sideSource = document.getElementById('sidebar-source');
    if (sideSource) sideSource.textContent = mapped.label;
  }
}

function getLaneThreshold(signal) {
  const lane = String(signal?.lane || 'intraday').toLowerCase();
  const fromPayload = Number(signal?.conditions_met?.threshold_normalized);
  if (Number.isFinite(fromPayload) && fromPayload > 0) return fromPayload;
  return lane === 'swing' ? 72 : 70;
}

function describeBlockedReason(code) {
  const map = {
    RR_BELOW_MIN: 'Risk/reward too low',
    HIGH_IMPACT_BLACKOUT: 'High-impact news time',
    SPREAD_TOO_WIDE: 'Spread too wide',
    STOP_DISTANCE_OUT_OF_BAND: 'Stop distance not valid',
    SCORE_BELOW_THRESHOLD: 'Quality score too low',
    ACTIVE_SIGNAL_EXISTS: 'Lane already has an active trade',
    ACTIVE_TRADE_OPEN: 'Trade already open in this lane',
    CONSECUTIVE_SL_LIMIT: 'Consecutive stop-loss guard',
    daily_guard_triggered: 'Daily risk guard active',
    INSERT_FAILED: 'Signal storage failed',
  };
  return map[code] || code || 'Waiting for setup';
}

function laneLabel(lane) {
  return String(lane || 'intraday').toLowerCase() === 'swing' ? 'Swing (H1/H4)' : 'Intraday (M15/H1)';
}

function buildLiveProgress(signal, currentPrice) {
  if (!signal) return 'Waiting for setup';
  const side = String(signal.signal_type || signal.type || '').toUpperCase();
  const state = String(signal.decision_state || signal.status || '').toUpperCase();
  const entry = Number(signal.entry_price || 0);
  const tp1 = Number(signal.tp1 || 0);
  const tp2 = Number(signal.tp2 || 0);
  const tp3 = Number(signal.tp3 || 0);
  const sl = Number(signal.stop_loss ?? signal.sl ?? 0);
  const price = Number(currentPrice || 0);

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(entry) || entry <= 0 || !side || side === 'WAIT') {
    return state === 'ACTIVE' || state === 'IN_TRADE' ? 'Live setup waiting for next price tick' : 'Watching next setup';
  }

  const deltaFromEntry = toXauPips(Math.abs(price - entry));
  const distance = (target) => `${toXauPips(Math.abs(target - price)).toFixed(1)}p`;

  if (side === 'BUY') {
    if (price >= tp3 && tp3 > 0) return `TP3 touched | ${distance(tp3)} beyond target`;
    if (price >= tp2 && tp2 > 0) return `Above TP2 | ${distance(tp3)} to TP3`;
    if (price >= tp1 && tp1 > 0) return `Above TP1 | ${distance(tp2)} to TP2`;
    if (price <= sl && sl > 0) return `At stop zone | ${distance(entry)} back to entry`;
    if (price >= entry) return `Live | +${deltaFromEntry.toFixed(1)}p from entry`;
    return `Below entry | ${deltaFromEntry.toFixed(1)}p to entry`;
  }

  if (side === 'SELL') {
    if (price <= tp3 && tp3 > 0) return `TP3 touched | ${distance(tp3)} beyond target`;
    if (price <= tp2 && tp2 > 0) return `Below TP2 | ${distance(tp3)} to TP3`;
    if (price <= tp1 && tp1 > 0) return `Below TP1 | ${distance(tp2)} to TP2`;
    if (price >= sl && sl > 0) return `At stop zone | ${distance(entry)} back to entry`;
    if (price <= entry) return `Live | +${deltaFromEntry.toFixed(1)}p from entry`;
    return `Above entry | ${deltaFromEntry.toFixed(1)}p to entry`;
  }

  return 'Watching next setup';
}

function renderSignalHero(decisionRun, signalsByLane = {}, currentPrice = null) {
  const hero = document.getElementById('signal-hero');
  if (!hero) return;
  const heroChip = document.querySelector('.hero-chip');
  if (heroChip) heroChip.textContent = 'Market Signals';

  const selectedLane = getSelectedSignalLane();
  const lanes = ['intraday', 'swing'];
  const laneModels = lanes.map((lane) => {
    const activeSignal = signalsByLane?.[lane] || null;
    const decision = decisionRun?.lanes?.[lane] || null;
    return activeSignal
      ? { ...(decision || {}), ...activeSignal, decision_state: decision?.decision_state || 'IN_TRADE', lane }
      : decision;
  }).filter(Boolean);

  if (laneModels.length === 0) {
    hero.innerHTML = `
      <div class="signal-hero__badge waiting">Waiting for lane decisions...</div>
      <div class="signal-hero__time">Price refresh: 3m | Signal bot: 5m</div>
    `;
    return;
  }

  hero.innerHTML = `
    <div class="signal-hero-grid">
      ${lanes.map((lane) => {
        const signal = laneModels.find((row) => String(row.lane || '').toLowerCase() === lane) || null;
        if (!signal) {
          return `
            <button type="button" class="signal-lane-card signal-lane-card--empty ${selectedLane === lane ? 'is-selected' : ''}" data-lane="${lane}">
              <div class="signal-lane-card__top">
                <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
                <span class="signal-lane-card__state">WAITING</span>
              </div>
              <div class="signal-lane-card__side waiting">NO TRADE</div>
              <div class="signal-lane-card__reason">No lane decision yet.</div>
            </button>
          `;
        }

        const decisionState = String(signal.decision_state || signal.status || 'NOT_READY').toUpperCase();
        const side = String(signal.signal_type || signal.type || 'WAIT').toUpperCase();
        const scoreNum = Math.max(0, Math.min(100, Number(signal.score_total || 0)));
        const confNum = Math.max(0, Math.min(100, Number(signal.confidence || scoreNum || 0)));
        const scoreClass = scoreNum >= 70 ? 'conf-high' : scoreNum >= 50 ? 'conf-med' : 'conf-low';
        const confClass = confNum >= 70 ? 'conf-high' : confNum >= 50 ? 'conf-med' : 'conf-low';
        const tradable = decisionState === 'ACTIVE' || decisionState === 'IN_TRADE';
        const sideLabel = tradable && (side === 'BUY' || side === 'SELL') ? side : 'NO TRADE';
        const badgeClass = sideLabel === 'BUY' ? 'buy' : sideLabel === 'SELL' ? 'sell' : 'waiting';
        const trigger = getLaneThreshold(signal);
        const reasonCode = signal.blocked_reason || signal.reason || signal?.conditions_met?.blocked_reason || '';
        const reasonText = tradable
          ? buildLiveProgress(signal, currentPrice)
          : `${side && side !== 'WAIT' ? `Best setup: ${side}. ` : ''}${describeBlockedReason(reasonCode)}`;
        const regime = signal.h1_regime || signal?.conditions_met?.adaptive_exits?.regime || ((Number(signal.adx_value || 0) >= 20) ? 'Trending' : 'Range');
        const time = formatMalaysiaTime(signal.created_at);

        return `
          <button type="button" class="signal-lane-card ${selectedLane === lane ? 'is-selected' : ''}" data-lane="${lane}">
            <div class="signal-lane-card__top">
              <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
              <span class="signal-lane-card__state">${decisionState === 'IN_TRADE' ? 'IN TRADE' : decisionState}</span>
            </div>
            <div class="signal-lane-card__side ${badgeClass}">${sideLabel}</div>
            <div class="signal-lane-card__headline">${lane === 'swing' ? 'Swing market signal' : 'Intraday market signal'}</div>
            <div class="signal-lane-card__reason">${reasonText}</div>
            <div class="signal-lane-card__metrics">
              <div class="hero-meter">
                <div class="hero-meter__head">Score <strong class="${scoreClass}">${scoreNum.toFixed(1)}/100</strong></div>
                <div class="hero-meter__track"><span class="hero-meter__fill ${scoreClass}" style="width:${scoreNum.toFixed(1)}%"></span></div>
              </div>
              <div class="hero-meter">
                <div class="hero-meter__head">Confidence <strong class="${confClass}">${confNum.toFixed(0)}%</strong></div>
                <div class="hero-meter__track"><span class="hero-meter__fill ${confClass}" style="width:${confNum.toFixed(1)}%"></span></div>
              </div>
            </div>
            <div class="signal-lane-card__meta">Trigger minimum: ${trigger.toFixed(0)}/100 | ${laneLabel(lane)}</div>
            <div class="signal-lane-card__meta">Regime: ${regime} | Session: ${signal.session_context || '--'}</div>
            <div class="signal-lane-card__time">${time || 'Waiting for engine update'}</div>
          </button>
        `;
      }).join('')}
    </div>
  `;

  hero.querySelectorAll('.signal-lane-card[data-lane]').forEach((card) => {
    card.addEventListener('click', () => setSelectedSignalLane(card.dataset.lane));
  });
}

function renderLevels(signal, currentPrice) {
  const container = document.getElementById('levels-row');
  const context = document.getElementById('trade-levels-context');
  if (!container) return;
  if (!signal) {
    if (context) {
      context.className = 'trade-levels-setup trade-levels-setup--neutral';
      context.innerHTML = `
        <span class="trade-levels-setup__title">Setup</span>
        <span class="trade-levels-setup__value">--</span>
        <span class="trade-levels-setup__lane">--</span>
      `;
    }
    return;
  }

  const entry = parseFloat(signal.entry_price) || 0;
  const tp1 = parseFloat(signal.tp1) || 0;
  const tp2 = parseFloat(signal.tp2) || 0;
  const tp3 = parseFloat(signal.tp3) || 0;
  const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;
  const price = currentPrice || entry;
  const signalType = signal.signal_type || signal.type;
  const status = String(signal.status || '').toUpperCase();
  const lane = String(signal.lane || 'intraday').toLowerCase();
  if (context) {
    const laneText = lane === 'swing' ? 'Swing (H1/H4)' : 'Intraday (M15/H1)';
    const side = String(signalType || '').toUpperCase();
    const isReady = status === 'ACTIVE';
    const sideCls = !isReady
      ? 'trade-levels-setup--neutral'
      : side === 'BUY'
        ? 'trade-levels-setup--buy'
        : side === 'SELL'
          ? 'trade-levels-setup--sell'
          : 'trade-levels-setup--neutral';
    const setupText = isReady ? (side || '--') : 'NO TRADE';
    const laneNote = isReady ? laneText : `${laneText} | candidate`;
    context.className = `trade-levels-setup ${sideCls}`;
    context.innerHTML = `
      <span class="trade-levels-setup__title">Setup</span>
      <span class="trade-levels-setup__value">${setupText}</span>
      <span class="trade-levels-setup__lane">${laneNote}</span>
    `;
  }

  const dist = (target) => {
    if (!target || !entry) return '';
    const delta = Math.abs(target - entry);
    const pips = toXauPips(delta);
    return `${pips.toFixed(1)}p`;
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

function renderConditions(decisionRun, snapshot, forcedLane = null) {
  const container = document.getElementById('conditions-row');
  if (!container) return;
  const lanes = ['intraday', 'swing'];

  const renderRow = (label, items, tone = 'neutral') => `
    <div class="conditions-block conditions-block--${tone}">
      <div class="conditions-block__label">${label}</div>
      <div class="conditions-block__chips">
        ${items.map((item) => `<span class="cond-chip ${item.met ? 'met' : 'blocked'}">${item.label}: ${item.met ? 'PASS' : 'BLOCKED'}</span>`).join('')}
      </div>
    </div>
  `;

  const makeConditionItems = (obj, lane) => {
    const source = obj && typeof obj === 'object' ? obj : {};
    const items = [
      { key: 'trend_filter', label: 'trend direction' },
      { key: 'momentum', label: 'price momentum' },
      { key: 'pullback', label: 'entry pullback' },
      { key: 'session_fit', label: 'session timing' },
      { key: 'volatility_spread', label: 'market quality' },
    ];
    if (lane === 'intraday') {
      items.push({ key: 'asian_range', label: 'asia breakout' });
    }
    return items.map((item) => ({ label: item.label, met: Boolean(source[item.key]) }));
  };

  const emptyItems = [
    { label: 'trend filter', met: false },
    { label: 'pullback', met: false },
    { label: 'momentum', met: false },
    { label: 'asian range', met: false },
    { label: 'volatility+spread', met: false },
    { label: 'session fit', met: false },
  ];

  const buildPreviewItems = (side, lane) => {
    if (!snapshot) return emptyItems;
    const adx = Number(snapshot.adx_value ?? snapshot.adx ?? 0);
    const stochK = Number(snapshot.stochrsi_k ?? 0);
    const stochD = Number(snapshot.stochrsi_d ?? 0);
    const macd = Number(snapshot.macd_value ?? snapshot.macd_histogram ?? 0);
    const atr = Number(snapshot.atr_value ?? snapshot.atr ?? 0);
    const adxMin = lane === 'swing' ? 20 : 18;
    const isBuy = side === 'BUY';
    return [
      { met: adx >= adxMin, label: 'trend filter' },
      { met: isBuy ? (stochK > stochD) : (stochK < stochD), label: 'pullback' },
      { met: isBuy ? macd >= 0 : macd <= 0, label: 'momentum' },
      { met: false, label: 'asian range' },
      { met: atr > 0, label: 'volatility+spread' },
      { met: adx >= adxMin, label: 'session fit' },
    ];
  };

  let activeLane = forcedLane || getSelectedSignalLane();
  if (!lanes.includes(activeLane)) activeLane = 'intraday';

  const getLaneData = (lane) => decisionRun?.lanes?.[lane] || null;
  const getCandidate = (lane, side) => {
    const laneData = getLaneData(lane);
    return laneData?.candidates?.[String(side || '').toLowerCase()] || null;
  };

  const renderSidePanel = (lane, side) => {
    const row = getCandidate(lane, side);
    const tone = side === 'BUY' ? 'buy' : 'sell';
    if (!row) {
      const previewRaw = buildPreviewItems(side, lane);
      const previewObj = {
        trend_filter: previewRaw.find((x) => x.label === 'trend filter')?.met,
        momentum: previewRaw.find((x) => x.label === 'momentum')?.met,
        pullback: previewRaw.find((x) => x.label === 'pullback')?.met,
        session_fit: previewRaw.find((x) => x.label === 'session fit')?.met,
        asian_range: previewRaw.find((x) => x.label === 'asian range')?.met,
        volatility_spread: previewRaw.find((x) => x.label === 'volatility+spread')?.met,
        macro_news: true,
      };
      const setupItems = makeConditionItems(previewObj, lane);
      return `
        <div class="conditions-lane-panel">
          <div class="conditions-side conditions-side--${side.toLowerCase()}">${side} setup</div>
          ${renderRow('Setup checks', setupItems, tone)}
          <div class="feature-note">Source: live preview (latest indicators)${lane === 'swing' ? ' | Asia breakout is intraday-only' : ''}</div>
        </div>
      `;
    }

    const c = row.conditions_met || {};
    const gates = c.hard_gates && typeof c.hard_gates === 'object' ? c.hard_gates : {};
    const newsCtx = c.news_context && typeof c.news_context === 'object' ? c.news_context : {};
    const setupItems = makeConditionItems(c, lane);
    const gateItems = [
      { key: 'spread_ok', label: 'spread cap' },
      { key: 'min_rr_ok', label: 'min RR' },
      { key: 'stop_band_ok', label: 'stop band' },
      { key: 'news_ok', label: 'news blackout' },
    ].map((item) => ({ label: item.label, met: Boolean(gates[item.key]) }));

    const blockedReason = row.blocked_reason || c.blocked_reason || '';
    const sessionText = c.session_context || row.session_context || '--';
    const newsText = newsCtx.high_blackout
      ? 'High-impact blackout active'
      : newsCtx.medium_penalty
        ? 'Medium-impact penalty active'
        : 'No active news penalty';

    return `
      <div class="conditions-lane-panel">
        <div class="conditions-side conditions-side--${side.toLowerCase()}">${side} setup</div>
        ${renderRow('Setup checks', setupItems, tone)}
        ${renderRow('Hard gates', gateItems, blockedReason ? 'sell' : 'buy')}
        <div class="feature-note">Session: ${sessionText} | News: ${newsText}</div>
        <div class="feature-note">Beginner note: aim for mostly PASS in setup checks, then hard gates must PASS.</div>
        ${lane === 'swing' ? '<div class="feature-note">Asia breakout is intraday-only, so it is hidden on Swing tab.</div>' : ''}
        ${blockedReason ? `<div class="feature-note">Blocked reason: ${blockedReason}</div>` : ''}
      </div>
    `;
  };

  const resolveAdaptiveExits = () => {
    const laneData = getLaneData(activeLane);
    const fromLane = laneData?.conditions_met?.adaptive_exits;
    if (fromLane && typeof fromLane === 'object') return fromLane;
    return getCandidate(activeLane, 'BUY')?.conditions_met?.adaptive_exits
      || getCandidate(activeLane, 'SELL')?.conditions_met?.adaptive_exits
      || null;
  };

  const adaptive = resolveAdaptiveExits();
  const adaptiveText = adaptive
    ? `Hybrid stop: ATR ${Number(adaptive.atr_stop_dist || 0).toFixed(2)} vs Structure ${Number(adaptive.structure_stop_dist || 0).toFixed(2)} | Regime: ${adaptive.regime || '--'} | Session mult (TP/SL): ${Number(adaptive.session_tp_mult || 1).toFixed(2)}/${Number(adaptive.session_stop_mult || 1).toFixed(2)}`
    : 'Hybrid stop transparency: waiting for adaptive exit payload.';

  container.innerHTML = `
    <div class="conditions-tabs" role="tablist" aria-label="Condition lanes">
      ${lanes.map((lane) => `
        <button type="button" class="conditions-tab ${lane === activeLane ? 'active' : ''}" data-lane="${lane}" role="tab" aria-selected="${lane === activeLane}">
          ${laneLabel(lane)}
        </button>
      `).join('')}
    </div>
    ${!['ACTIVE', 'IN_TRADE'].includes(String(getLaneData(activeLane)?.decision_state || '').toUpperCase())
      ? '<div class="feature-note feature-note--warning">No active trade now. BUY/SELL below are setup checks only.</div>'
      : ''}
    <div class="feature-note">${adaptiveText}</div>
    <div class="conditions-dual">
      ${renderSidePanel(activeLane, 'BUY')}
      ${renderSidePanel(activeLane, 'SELL')}
    </div>
  `;

  container.querySelectorAll('.conditions-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = String(btn.dataset.lane || '').toLowerCase();
      if (!lanes.includes(lane)) return;
      setSelectedSignalLane(lane);
      renderConditions(decisionRun, snapshot, lane);
    });
  });
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
  const successStatuses = new Set(['HIT_TP1', 'HIT_TP2', 'HIT_TP3']);
  const successfulSignals = Array.isArray(signals)
    ? signals.filter((s) => successStatuses.has(String(s.status || '').toUpperCase()))
    : [];

  if (!successfulSignals || successfulSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No successful signals yet</div>
        <div class="empty-state__sub">Only TP-hit signals are shown in history</div>
      </div>
    `;
    return;
  }

  container.innerHTML = successfulSignals.map((s) => {
    const type = s.signal_type || s.type || 'WAIT';
    const entry = parseFloat(s.entry_price) || 0;
    const conf = s.confidence || 0;
    const score = Number(s.score_total || 0).toFixed(1);
    const lane = (s.lane || 'intraday').toUpperCase();
    const blockedReason = s.blocked_reason || '';
    const time = formatMalaysiaTime(s.created_at);
    const status = (s.status || 'ACTIVE').replace('_', ' ');

    let statusCls = 'active';
    if (status.includes('TP')) statusCls = 'hit-tp';
    if (status.includes('SL')) statusCls = 'hit-sl';
    if (status === 'EXPIRED') statusCls = 'expired';
    if (status === 'REJECTED') statusCls = 'blocked';

    return `
      <div class="history-item">
        <div class="history-item__type ${type.toLowerCase()}">${type}</div>
        <div class="history-item__info">
          <div class="history-item__entry">$${entry.toFixed(2)}</div>
          <div class="history-item__meta">${time} | ${lane} | Score ${score}</div>
          ${blockedReason ? `<div class="history-item__meta">Reason: ${blockedReason}</div>` : ''}
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

function renderPolymarketDashboard(btcTick, markets) {
  if (btcTick !== undefined) {
    polymarketState.btcTick = btcTick || null;
  }
  if (markets !== undefined) {
    polymarketState.markets = Array.isArray(markets)
      ? markets.map(normalizePolymarketRow).filter(Boolean)
      : [];
  }

  const activeBtc = polymarketState.btcTick;
  const rawMarkets = Array.isArray(polymarketState.markets) ? polymarketState.markets : [];
  const allMarkets = rawMarkets.filter((row) => POLY_CATEGORIES.includes(row.category) && row.category !== 'all');
  const unmatchedCount = Math.max(0, rawMarkets.length - allMarkets.length);
  const activeCategory = polymarketState.category;
  const activeSort = polymarketState.sort;
  const activeQuery = polymarketState.query;
  const activeView = polymarketState.view;
  const activeBetType = polymarketState.betType;

  const tabButtons = Array.from(document.querySelectorAll('#polymarket-tabs .poly-tab'));
  const betButtons = Array.from(document.querySelectorAll('#polymarket-bet-tabs .poly-bet-tab'));
  const viewButtons = Array.from(document.querySelectorAll('#polymarket-view-nav .poly-view-tab'));
  const categoryCounts = { all: allMarkets.length };
  allMarkets.forEach((m) => {
    if (POLY_CATEGORIES.includes(m.category)) {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    }
  });
  tabButtons.forEach((btn) => {
    const category = String(btn.dataset.category || 'all').toLowerCase();
    const isActive = category === activeCategory;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    const count = Number(categoryCounts[category] || 0);
    btn.textContent = `${baseLabel.split(' (')[0]} (${count})`;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  let baseFiltered = allMarkets.slice();
  if (activeCategory !== 'all') {
    baseFiltered = baseFiltered.filter((m) => m.category === activeCategory);
  }
  if (activeQuery) {
    baseFiltered = baseFiltered.filter((m) => {
      const haystack = `${m.title} ${m.category} ${m.status} ${m.marketType}`.toLowerCase();
      return haystack.includes(activeQuery);
    });
  }

  const betTypeCounts = {
    all: baseFiltered.length,
    up_down: baseFiltered.filter((m) => m.marketType === 'up_down').length,
    above_below: baseFiltered.filter((m) => m.marketType === 'above_below').length,
    price_range: baseFiltered.filter((m) => m.marketType === 'price_range').length,
    hit_price: baseFiltered.filter((m) => m.marketType === 'hit_price').length,
  };
  betButtons.forEach((btn) => {
    const value = String(btn.dataset.betType || 'all').toLowerCase();
    const isActive = value === activeBetType;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    const count = Number(betTypeCounts[value] || 0);
    btn.textContent = `${baseLabel.split(' (')[0]} (${count})`;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const viewCounts = {
    all: baseFiltered.length,
    active: baseFiltered.filter((m) => m.status === 'active').length,
    ending: baseFiltered.filter((m) => m.status === 'active' && Number.isFinite(m.hoursUntil) && m.hoursUntil >= 0 && m.hoursUntil <= 72).length,
    resolved: baseFiltered.filter((m) => m.status.includes('resolved') || m.status.includes('closed')).length,
  };
  viewButtons.forEach((btn) => {
    const view = String(btn.dataset.view || 'all').toLowerCase();
    const isActive = view === activeView;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    const count = Number(viewCounts[view] || 0);
    btn.textContent = `${baseLabel.split(' (')[0]} (${count})`;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  let filtered = baseFiltered.slice();
  if (activeBetType !== 'all') {
    filtered = filtered.filter((m) => m.marketType === activeBetType);
  }
  if (activeView === 'active') {
    filtered = filtered.filter((m) => m.status === 'active');
  } else if (activeView === 'ending') {
    filtered = filtered.filter((m) => m.status === 'active' && Number.isFinite(m.hoursUntil) && m.hoursUntil >= 0 && m.hoursUntil <= 72);
  } else if (activeView === 'resolved') {
    filtered = filtered.filter((m) => m.status.includes('resolved') || m.status.includes('closed'));
  }

  const sorters = {
    volume: (a, b) => (Number(b.volume) || -Infinity) - (Number(a.volume) || -Infinity),
    liquidity: (a, b) => (Number(b.liquidity) || -Infinity) - (Number(a.liquidity) || -Infinity),
    ending: (a, b) => {
      const ah = Number.isFinite(a.hoursUntil) && a.hoursUntil >= 0 ? a.hoursUntil : Infinity;
      const bh = Number.isFinite(b.hoursUntil) && b.hoursUntil >= 0 ? b.hoursUntil : Infinity;
      return ah - bh;
    },
    probability: (a, b) => {
      const av = Number.isFinite(a.yesPct) ? Math.max(a.yesPct, 100 - a.yesPct) : -Infinity;
      const bv = Number.isFinite(b.yesPct) ? Math.max(b.yesPct, 100 - b.yesPct) : -Infinity;
      return bv - av;
    },
  };
  filtered.sort(sorters[activeSort] || sorters.volume);

  const btcPriceEl = document.getElementById('polymarket-btc-price');
  const btcChangeEl = document.getElementById('polymarket-btc-change');
  const syncEl = document.getElementById('polymarket-last-sync');
  const kpiCountEl = document.getElementById('polymarket-kpi-count');
  const kpiVolEl = document.getElementById('polymarket-kpi-volume');
  const kpiEndingEl = document.getElementById('polymarket-kpi-ending');
  const diagnosticsEl = document.getElementById('polymarket-diagnostics');
  const trendEl = document.getElementById('polymarket-trending-list');
  const listEl = document.getElementById('polymarket-markets-list');

  if (btcPriceEl) {
    if (!activeBtc || !Number.isFinite(Number(activeBtc.price))) {
      btcPriceEl.textContent = '$--';
      btcPriceEl.className = 'polymarket-btc__price';
    } else {
      const price = Number(activeBtc.price);
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      const cls = Number.isFinite(change24h) ? (change24h >= 0 ? 'up' : 'down') : '';
      btcPriceEl.textContent = `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      btcPriceEl.className = `polymarket-btc__price ${cls}`.trim();
    }
  }

  if (btcChangeEl) {
    if (!activeBtc) {
      btcChangeEl.textContent = 'Waiting for feed...';
    } else {
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      if (Number.isFinite(change24h)) {
        const sign = change24h >= 0 ? '+' : '-';
        const icon = change24h >= 0 ? '\u25B2' : '\u25BC';
        btcChangeEl.textContent = `${icon} ${sign}${Math.abs(change24h).toFixed(2)}% (24h)`;
      } else {
        btcChangeEl.textContent = '24h change unavailable';
      }
    }
  }

  if (syncEl) {
    const ts = activeBtc?.provider_ts || activeBtc?.created_at || null;
    syncEl.textContent = ts ? `Last sync: ${formatMalaysiaTime(ts)}` : 'Δ --';
  }

  if (kpiCountEl) {
    kpiCountEl.textContent = String(filtered.length);
  }
  if (kpiVolEl) {
    const totalVol = filtered.reduce((sum, m) => sum + (Number.isFinite(m.volume) ? m.volume : 0), 0);
    kpiVolEl.textContent = formatCompactUsd(totalVol);
  }
  if (kpiEndingEl) {
    const endingSoon = filtered.filter((m) => Number.isFinite(m.hoursUntil) && m.hoursUntil >= 0 && m.hoursUntil <= 48).length;
    kpiEndingEl.textContent = String(endingSoon);
  }
  if (diagnosticsEl) {
    diagnosticsEl.textContent = `Loaded ${allMarkets.length} mapped markets | ${unmatchedCount} unmatched`;
  }

  if (getDashboardMode() === 'polymarket') {
    const headerPrice = document.getElementById('header-price');
    const headerChange = document.getElementById('header-change');
    if (headerPrice) {
      if (activeBtc && Number.isFinite(Number(activeBtc.price))) {
        const price = Number(activeBtc.price);
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        headerPrice.textContent = `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        headerPrice.className = 'topbar__price';
        if (Number.isFinite(chg)) {
          headerPrice.classList.add(chg >= 0 ? 'up' : 'down');
        } else {
          headerPrice.classList.add('neutral');
        }
      } else {
        headerPrice.textContent = '$--';
        headerPrice.className = 'topbar__price neutral';
      }
    }
    if (headerChange) {
      if (activeBtc) {
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        const ts = activeBtc.provider_ts || activeBtc.created_at;
        const age = ts ? `Last sync: ${formatMalaysiaTime(ts, true)}` : 'Δ --';
        headerChange.textContent = Number.isFinite(chg)
          ? `BTC 24h: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% | ${age}`
          : `BTC 24h: -- | ${age}`;
      } else {
        headerChange.textContent = 'Waiting for BTC feed';
      }
    }
  }

  if (trendEl) {
    const trending = filtered
      .filter((m) => m.status === 'active')
      .slice()
      .sort((a, b) => (Number(b.volume) || -Infinity) - (Number(a.volume) || -Infinity))
      .slice(0, 5);
    if (trending.length === 0) {
      trendEl.innerHTML = '<div class="feature-note">No trending markets for this tab yet.</div>';
    } else {
      trendEl.innerHTML = trending.map((market) => {
        const prob = Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(1)}% YES` : '--';
        const vol = Number.isFinite(market.volume) ? formatCompactUsd(market.volume) : '--';
        const catLabel = POLY_LABELS[market.category] || market.category.toUpperCase();
        return `
          <div class="poly-trend-chip">
            <div class="poly-trend-chip__title">${escapeHtml(market.title)}</div>
            <div class="poly-trend-chip__meta">${escapeHtml(catLabel)} | ${escapeHtml(prob)} | Vol ${escapeHtml(vol)}</div>
          </div>
        `;
      }).join('');
    }
  }

  if (!listEl) return;
  if (!Array.isArray(filtered) || filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No markets in this tab yet</div>
        <div class="empty-state__sub">Try another category, clear search, or wait for the next collector sync.</div>
      </div>
    `;
    return;
  }

  const top = filtered.slice(0, 60);
  listEl.innerHTML = top.map((market) => {
    const category = POLY_LABELS[market.category] || String(market.category || 'Other').toUpperCase();
    const iconByCategory = {
      trending: 'Tr',
      breaking: 'Br',
      new: 'Nw',
      politics: 'Po',
      finance: 'Fi',
      oil: 'Oi',
      geopolitics: 'Ge',
      xauusd: 'Au',
    };
    const categoryIcon = iconByCategory[market.category] || 'Mk';
    const typeLabelMap = {
      all: 'General',
      up_down: 'Up/Down',
      above_below: 'Above/Below',
      price_range: 'Price Range',
      hit_price: 'Hit Price',
    };
    const typeLabel = typeLabelMap[market.marketType] || 'General';
    const yesText = Number.isFinite(market.yesPct) ? `${Math.round(market.yesPct)}c` : '--';
    const noText = Number.isFinite(market.noPct) ? `${Math.round(market.noPct)}c` : '--';
    const yesPctText = Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(1)}%` : '--';
    const noPctText = Number.isFinite(market.noPct) ? `${market.noPct.toFixed(1)}%` : '--';
    const probWidth = Number.isFinite(market.yesPct) ? Math.max(2, Math.min(98, market.yesPct)) : 50;
    const volText = Number.isFinite(market.volume) ? formatCompactUsd(market.volume) : '--';
    const liqText = Number.isFinite(market.liquidity) ? formatCompactUsd(market.liquidity) : '--';

    let endText = '--';
    if (market.endDate) {
      if (Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0) {
        endText = market.hoursUntil < 24
          ? `${market.hoursUntil.toFixed(1)}h left`
          : `${Math.ceil(market.hoursUntil / 24)}d left`;
      } else if (Number.isFinite(market.hoursUntil) && market.hoursUntil < 0) {
        endText = 'Ended';
      } else {
        endText = formatMalaysiaTime(market.endDate, true);
      }
    }

    let statusText = 'ACTIVE';
    let statusClass = 'status-active';
    if (market.status.includes('closed')) {
      statusText = 'CLOSED';
      statusClass = 'status-closed';
    } else if (market.status.includes('resolved')) {
      statusText = 'RESOLVED';
      statusClass = 'status-resolved';
    }

    return `
      <article class="polymarket-card">
        <div class="polymarket-card__head">
          <div class="polymarket-card__asset">${escapeHtml(categoryIcon)}</div>
          <div class="polymarket-card__title-wrap">
            <div class="polymarket-card__title">${escapeHtml(market.title)}</div>
            <div class="polymarket-card__catline">${escapeHtml(category)} | ${escapeHtml(typeLabel)}</div>
          </div>
          <span class="polymarket-card__status ${statusClass}">${statusText}</span>
        </div>
        <div class="polymarket-card__odds">
          <div class="poly-odd poly-odd--yes">
            <div class="poly-odd__label">Yes</div>
            <div class="poly-odd__value">${yesText}</div>
            <div class="poly-odd__pct">${yesPctText}</div>
          </div>
          <div class="poly-odd poly-odd--no">
            <div class="poly-odd__label">No</div>
            <div class="poly-odd__value">${noText}</div>
            <div class="poly-odd__pct">${noPctText}</div>
          </div>
        </div>
        <div class="poly-prob-row">
          <span>YES probability: ${yesPctText}</span>
          <span>NO probability: ${noPctText}</span>
        </div>
        <div class="poly-prob-track" aria-label="Yes probability">
          <span class="poly-prob-fill" style="width:${probWidth.toFixed(1)}%"></span>
        </div>
        <div class="polymarket-card__meta">
          <span>Volume: ${volText}</span>
          <span>Liquidity: ${liqText}</span>
          <span>Ends: ${endText}</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderStats(stats) {
  if (!stats) return;

  const heroEl = document.getElementById('stats-hero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="stats-hero__winrate">${stats.winRate}%</div>
      <div class="stats-hero__label">Win Rate (${stats.totalSignals} signals) | Expectancy ${stats.expectancy ?? '--'}R</div>
      ${stats.windows ? `<div class="stats-hero__label">Rolling E: 50=${stats.windows.w50?.expectancy ?? '--'} | 100=${stats.windows.w100?.expectancy ?? '--'} | 300=${stats.windows.w300?.expectancy ?? '--'}</div>` : ''}
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
        <div class="stat-tile__label">Executed / Rejected</div>
        <div class="stat-tile__value">${stats.executedCount ?? '--'} / ${stats.rejectedCount ?? '--'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Total Pips</div>
        <div class="stat-tile__value" style="color:${parseFloat(stats.totalPips) >= 0 ? 'var(--green)' : 'var(--red)'}">${stats.totalPips}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Avg RR / Drawdown</div>
        <div class="stat-tile__value">${stats.avgRR ?? '--'} / ${stats.drawdown ?? '--'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Lane Win (I / S)</div>
        <div class="stat-tile__value">${stats.laneStats?.intraday?.winRate ?? '--'}% / ${stats.laneStats?.swing?.winRate ?? '--'}%</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Lane Expectancy (I / S)</div>
        <div class="stat-tile__value">${stats.laneStats?.intraday?.expectancy ?? '--'} / ${stats.laneStats?.swing?.expectancy ?? '--'}</div>
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

function initDemoControls({ onToggleAutoTrade, onResetDemoAccount, onRefresh }) {
  const toggle = document.getElementById('demo-auto-toggle');
  const resetBtn = document.getElementById('demo-reset-btn');
  const status = document.getElementById('demo-control-status');

  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('change', async () => {
      toggle.disabled = true;
      if (status) status.textContent = 'Saving auto-trade setting...';
      try {
        await onToggleAutoTrade(Boolean(toggle.checked));
        if (status) status.textContent = `Auto-trade ${toggle.checked ? 'enabled' : 'disabled'}.`;
        if (onRefresh) await onRefresh();
      } catch (err) {
        if (status) status.textContent = err?.message || 'Failed to update auto-trade setting.';
      } finally {
        toggle.disabled = false;
      }
    });
  }

  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', async () => {
      const ok = window.confirm('Reset demo account to $100,000 and clear all demo trades?');
      if (!ok) return;
      resetBtn.disabled = true;
      if (status) status.textContent = 'Resetting demo account...';
      try {
        await onResetDemoAccount();
        if (status) status.textContent = 'Demo account reset complete.';
        if (onRefresh) await onRefresh();
      } catch (err) {
        if (status) status.textContent = err?.message || 'Demo reset failed.';
      } finally {
        resetBtn.disabled = false;
      }
    });
  }
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderDemoEquityCurve(points) {
  const host = document.getElementById('demo-equity-chart');
  if (!host) return;
  if (!Array.isArray(points) || points.length < 2) {
    host.innerHTML = '<div class="feature-note">Need at least 2 equity points to draw curve.</div>';
    return;
  }

  const values = points.map((p) => Number(p.equity || 0)).filter((v) => Number.isFinite(v));
  if (values.length < 2) {
    host.innerHTML = '<div class="feature-note">Need at least 2 equity points to draw curve.</div>';
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);

  const w = 100;
  const h = 36;
  const pad = 2;
  const path = values
    .map((v, i) => {
      const x = pad + ((w - pad * 2) * i) / Math.max(values.length - 1, 1);
      const y = h - pad - ((h - pad * 2) * (v - min)) / span;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  host.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Demo equity curve">
      <polyline class="equity-line" points="${path}"></polyline>
    </svg>
  `;
}

function renderDemoDashboard(perf, curve = [], trades = [], events = []) {
  const summary = document.getElementById('demo-summary-grid');
  const lane = document.getElementById('demo-lane-split');
  const history = document.getElementById('demo-trade-history');
  const toggle = document.getElementById('demo-auto-toggle');
  const status = document.getElementById('demo-control-status');

  if (!summary || !lane || !history) return;

  if (!perf || !perf.account) {
    summary.innerHTML = `
      <div class="stat-tile">
        <div class="stat-tile__label">Demo account</div>
        <div class="stat-tile__value">Loading...</div>
      </div>
    `;
    lane.innerHTML = '';
    history.innerHTML = '<div class="feature-note">No demo trades yet.</div>';
    renderDemoEquityCurve(curve);
    return;
  }

  const roiColor = perf.roiPct >= 0 ? 'var(--green)' : 'var(--red)';
  const pnlColor = perf.pnlTotal >= 0 ? 'var(--green)' : 'var(--red)';

  summary.innerHTML = `
    <div class="stat-tile"><div class="stat-tile__label">Starting Capital</div><div class="stat-tile__value">${formatMoney(perf.starting)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Balance</div><div class="stat-tile__value">${formatMoney(perf.balance)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Equity</div><div class="stat-tile__value">${formatMoney(perf.equity)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">ROI</div><div class="stat-tile__value" style="color:${roiColor}">${perf.roiPct.toFixed(2)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Open Trades</div><div class="stat-tile__value">${perf.openTrades}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Win Rate</div><div class="stat-tile__value">${perf.winRate.toFixed(1)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Max Drawdown</div><div class="stat-tile__value">${perf.maxDrawdownPct.toFixed(2)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Net PnL</div><div class="stat-tile__value" style="color:${pnlColor}">${formatMoney(perf.pnlTotal)}</div></div>
  `;

  lane.innerHTML = `
    <div class="lane-chip">
      <span>Intraday</span>
      <span>${perf.laneStats?.intraday?.trades ?? 0} trades</span>
      <span>${(perf.laneStats?.intraday?.winRate ?? 0).toFixed(1)}% win</span>
    </div>
    <div class="lane-chip">
      <span>Swing</span>
      <span>${perf.laneStats?.swing?.trades ?? 0} trades</span>
      <span>${(perf.laneStats?.swing?.winRate ?? 0).toFixed(1)}% win</span>
    </div>
  `;

  const eventRows = Array.isArray(events) ? events.slice(0, 24) : [];
  const tradeRows = Array.isArray(trades) ? trades.slice(0, 20) : [];
  if (eventRows.length === 0 && tradeRows.length === 0) {
    history.innerHTML = '<div class="feature-note">No demo trades yet.</div>';
  } else if (eventRows.length > 0) {
    const eventLabels = {
      OPEN: 'Opened',
      TP1_PARTIAL: 'TP1 partial',
      SL_TO_BREAKEVEN: 'SL -> breakeven',
      TP2: 'TP2',
      TP3: 'TP3',
      STOP_LOSS: 'Stop loss',
      BREAKEVEN: 'Breakeven',
      EXPIRED: 'Expired',
    };
    history.innerHTML = eventRows.map((evt) => {
      const laneText = String(evt.lane || 'intraday').toUpperCase();
      const eventType = String(evt.event_type || '--').toUpperCase();
      const price = Number(evt.event_price || 0);
      const pnl = Number(evt.pnl_usd || 0);
      const pnlCls = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'text-muted';
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${eventLabels[eventType] || eventType}</div>
            <div class="demo-trade-row__sub">Price ${price ? price.toFixed(2) : '--'} | Size ${Number(evt.realized_size || 0).toFixed(3)} | Left ${Number(evt.remaining_size || 0).toFixed(3)}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${formatMoney(pnl)}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(evt.created_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    history.innerHTML = tradeRows.map((t) => {
      const side = String(t.side || '--').toUpperCase();
      const laneText = String(t.lane || 'intraday').toUpperCase();
      const statusText = String(t.status || '--').toUpperCase();
      const pnl = Number(t.pnl_usd || 0);
      const pnlCls = statusText === 'BREAKEVEN' ? 'text-muted' : (pnl >= 0 ? 'profit' : 'loss');
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${side} | ${statusText}</div>
            <div class="demo-trade-row__sub">Entry ${Number(t.entry || 0).toFixed(2)} | SL ${Number(t.sl || 0).toFixed(2)}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${formatMoney(pnl)}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(t.opened_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (toggle) toggle.checked = Boolean(perf.account.auto_trade_enabled);
  if (status && !status.textContent) {
    status.textContent = `Expectancy: ${Number(perf.expectancyR || 0).toFixed(2)}R`;
  }

  renderDemoEquityCurve((Array.isArray(curve) && curve.length > 0) ? curve : perf.equityPoints || []);
}

function updateRiskCalc(signal, riskState = null) {
  const lotInput = document.getElementById('lot-input');
  if (!lotInput) return;
  const equityInput = document.getElementById('equity-input');
  const riskPctInput = document.getElementById('risk-percent-input');
  const laneSelect = document.getElementById('lane-risk-select');
  const posSizeEl = document.getElementById('position-size-value');
  const riskGuardEl = document.getElementById('risk-guard-note');

  const body = document.getElementById('risk-calc-body');
  if (!body) return;

  const applyLanePreset = () => {
    if (!riskPctInput || !laneSelect) return;
    if (!riskPctInput.dataset.userEdited) {
      riskPctInput.value = laneSelect.value === 'swing' ? '0.75' : '0.50';
    }
  };

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
    const equity = parseFloat(equityInput?.value || '10000') || 10000;
    const riskPct = parseFloat(riskPctInput?.value || signalData.risk_percent_used || '0.50') || 0.5;
    const entry = parseFloat(signalData.entry_price) || 0;
    const sl = parseFloat(signalData.stop_loss ?? signalData.sl) || 0;
    const tp1 = parseFloat(signalData.tp1) || 0;
    const tp2 = parseFloat(signalData.tp2) || 0;
    const tp3 = parseFloat(signalData.tp3) || 0;
    const stopDist = Math.abs(entry - sl);
    const riskDollars = equity * (riskPct / 100);
    const posSize = stopDist > 0 ? riskDollars / stopDist : 0;
    if (posSizeEl) posSizeEl.textContent = Number.isFinite(posSize) ? posSize.toFixed(3) : '--';

    vals[0].textContent = `-$${riskDollars.toFixed(2)}`;
    vals[0].className = 'risk-val__num loss';
    vals[1].textContent = `+$${(riskDollars * (Math.abs(tp1 - entry) / Math.max(stopDist, 0.0001))).toFixed(2)}`;
    vals[1].className = 'risk-val__num profit';
    vals[2].textContent = `+$${(riskDollars * (Math.abs(tp2 - entry) / Math.max(stopDist, 0.0001))).toFixed(2)}`;
    vals[2].className = 'risk-val__num profit';
    vals[3].textContent = `+$${(riskDollars * (Math.abs(tp3 - entry) / Math.max(stopDist, 0.0001))).toFixed(2)}`;
    vals[3].className = 'risk-val__num profit';
  };

  if (!lotInput._riskBound) {
    lotInput.addEventListener('input', setValues);
    if (equityInput) equityInput.addEventListener('input', setValues);
    if (riskPctInput) {
      riskPctInput.addEventListener('input', () => {
        riskPctInput.dataset.userEdited = '1';
        setValues();
      });
    }
    if (laneSelect) {
      laneSelect.addEventListener('change', () => {
        if (riskPctInput?.dataset) delete riskPctInput.dataset.userEdited;
        applyLanePreset();
        setValues();
      });
    }
    lotInput._riskBound = true;
  }

  applyLanePreset();
  if (laneSelect && signal && !laneSelect.dataset.userEdited) {
    laneSelect.value = signal.lane === 'swing' ? 'swing' : 'intraday';
    applyLanePreset();
  }
  lotInput._riskSignal = signal || null;
  setValues();

  if (riskGuardEl && riskState) {
    const dailyLoss = Number(riskState.daily_loss_pct || 0).toFixed(2);
    const streak = Number(riskState.consecutive_sl || 0);
    const cooldown = riskState.cooldown_until ? `Cooldown until ${formatMalaysiaTime(riskState.cooldown_until, true)}` : 'No cooldown';
    const halt = riskState.halted_reason ? ` | Halt: ${riskState.halted_reason}` : '';
    riskGuardEl.textContent = `Daily risk: ${dailyLoss}% loss | Consecutive SL: ${streak} | ${cooldown}${halt}`;
  }
}

window.UI = {
  initTheme,
  initTranslateToggle,
  initNavigation,
  initDashboardSwitch,
  initPolymarketControls,
  getSelectedSignalLane,
  setSelectedSignalLane,
  setDashboardMode,
  getDashboardMode,
  initChartTime,
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
  renderPolymarketDashboard,
  renderStats,
  initDemoControls,
  renderDemoDashboard,
  renderDemoEquityCurve,
  updateRiskCalc,
};


