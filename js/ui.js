/**
 * ui.js - DOM rendering for XAU Radar dashboard.
 */

const APP_TIMEZONE = 'Asia/Kuala_Lumpur';
const APP_TZ_LABEL = 'MYT';
const THEME_KEY = 'xauradar_theme';
const XAU_PIP_SIZE = 0.1;
const LANG_KEY = 'xauradar_lang';
const GOOGLE_TRANSLATE_SCRIPT_ID = 'xauradar-google-translate-script';
const GOOGLE_TRANSLATE_CALLBACK = '__xauRadarGoogleTranslateInit';
const DASHBOARD_MODE_KEY = 'xauradar_dashboard_mode';
const SIGNAL_LANE_KEY = 'xauradar_signal_lane';
const SIGNAL_EXPANDED_KEY = 'xauradar_signal_expanded';
const POLY_CATEGORY_KEY = 'xauradar_poly_category';
const POLY_SORT_KEY = 'xauradar_poly_sort';
const POLY_VIEW_KEY = 'xauradar_poly_view';
const POLY_BET_TYPE_KEY = 'xauradar_poly_bet_type';

let activeDashboardMode = 'xau';
let lastXauPage = 'signal';
const polymarketState = {
  btcTick: null,
  markets: [],
  fallbackMarkets: [],
  slices: { trending: [], breaking: [], new: [] },
  feedStatus: {
    liveOk: false,
    fallbackUsed: false,
    sourceMode: 'idle',
    sourceLabel: 'Waiting for live feed',
    fetchedAt: null,
    error: '',
  },
  category: 'all',
  query: '',
  sort: 'volume',
  view: 'all',
  betType: 'all',
  renderCount: 60,
  selectedMarketSlug: '',
  historyBySlug: {},
};
const POLY_CATEGORIES = ['all', 'trending', 'breaking', 'new', 'politics', 'crypto', 'finance', 'geopolitics', 'oil', 'xauusd'];
const POLY_SORT_OPTIONS = ['volume', 'liquidity', 'ending', 'probability'];
const POLY_VIEW_OPTIONS = ['all', 'active', 'ending', 'resolved'];
const POLY_BET_TYPE_OPTIONS = ['all', 'up_down', 'above_below', 'price_range', 'hit_price'];
const POLY_LABELS = {
  all: 'All',
  trending: 'Trending',
  breaking: 'Breaking',
  new: 'New',
  politics: 'Politics',
  crypto: 'Crypto',
  finance: 'Finance',
  oil: 'Oil',
  geopolitics: 'Geopolitics',
  xauusd: 'XAUUSD',
};
const POLY_MARKET_TYPE_LABELS = {
  all: 'General',
  up_down: 'Up / Down',
  above_below: 'Above / Below',
  price_range: 'Price Range',
  hit_price: 'Hit Price',
};

let googleTranslateLoader = null;
const animatedValueState = new Map();
let polymarketListScrollTop = 0;

function getSelectedSignalLane() {
  return String(localStorage.getItem(SIGNAL_LANE_KEY) || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
}

function getExpandedSignalLanes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNAL_EXPANDED_KEY) || '{}');
    return {
      intraday: Boolean(parsed?.intraday),
      swing: Boolean(parsed?.swing),
    };
  } catch {
    return { intraday: false, swing: false };
  }
}

function isSignalLaneExpanded(lane) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  return Boolean(getExpandedSignalLanes()[normalized]);
}

function setSignalLaneExpanded(lane, expanded, emit = true) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  const next = {
    ...getExpandedSignalLanes(),
    [normalized]: Boolean(expanded),
  };
  localStorage.setItem(SIGNAL_EXPANDED_KEY, JSON.stringify(next));
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:signal-lane-expand', { detail: { lane: normalized, expanded: Boolean(expanded) } }));
  }
  return next[normalized];
}

function toggleSignalLaneExpanded(lane, emit = true) {
  const next = !isSignalLaneExpanded(lane);
  return setSignalLaneExpanded(lane, next, emit);
}

function setSelectedSignalLane(lane, emit = true) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  localStorage.setItem(SIGNAL_LANE_KEY, normalized);
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:signal-lane-change', { detail: { lane: normalized } }));
  }
  return normalized;
}

function pulseAnimatedElement(el, direction = 'neutral') {
  if (!el) return;
  el.classList.remove('value-refresh', 'value-refresh--up', 'value-refresh--down', 'value-refresh--neutral');
  void el.offsetWidth;
  el.classList.add('value-refresh', `value-refresh--${direction}`);
}

function setAnimatedContent(el, key, displayValue, options = {}) {
  if (!el) return;
  const { html = false, numericValue = NaN } = options;
  const normalizedDisplay = String(displayValue ?? '');
  const nextNumeric = Number.isFinite(numericValue) ? Number(numericValue) : NaN;
  const previous = animatedValueState.get(key);
  const changed = !previous || previous.display !== normalizedDisplay;

  if (html) {
    el.innerHTML = normalizedDisplay;
  } else {
    el.textContent = normalizedDisplay;
  }

  if (changed && previous) {
    let direction = 'neutral';
    if (Number.isFinite(previous.numeric) && Number.isFinite(nextNumeric)) {
      if (nextNumeric > previous.numeric) direction = 'up';
      else if (nextNumeric < previous.numeric) direction = 'down';
    }
    pulseAnimatedElement(el, direction);
  }

  animatedValueState.set(key, { display: normalizedDisplay, numeric: nextNumeric });
}

function setAnimatedButtonCount(btn, key, label, count) {
  if (!btn) return;
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  const text = `${String(label || '').split(' (')[0]} (${safeCount})`;
  const previous = animatedValueState.get(key);
  btn.textContent = text;
  if (previous && previous.numeric !== safeCount) {
    const direction = safeCount > previous.numeric ? 'up' : safeCount < previous.numeric ? 'down' : 'neutral';
    pulseAnimatedElement(btn, direction);
  }
  animatedValueState.set(key, { display: text, numeric: safeCount });
}

function buildAnimatedInlineMarkup(key, displayValue, numericValue, tagName = 'span', className = '', inlineStyle = '') {
  const safeTag = String(tagName || 'span').toLowerCase();
  const attrs = [
    className ? `class="${escapeHtml(className)}"` : '',
    `data-animate-key="${escapeHtml(key)}"`,
    `data-animate-value="${escapeHtml(String(numericValue))}"`,
    inlineStyle ? `style="${escapeHtml(inlineStyle)}"` : '',
  ].filter(Boolean).join(' ');
  return `<${safeTag} ${attrs}>${escapeHtml(String(displayValue))}</${safeTag}>`;
}

function applyAnimatedValues(root) {
  if (!root) return;
  root.querySelectorAll('[data-animate-key]').forEach((el) => {
    const key = String(el.getAttribute('data-animate-key') || '').trim();
    if (!key) return;
    const numericValue = Number(el.getAttribute('data-animate-value'));
    const displayValue = el.textContent || '';
    setAnimatedContent(el, key, displayValue, { numericValue });
  });
}

function getSelectedPolymarketMarketSlug() {
  return String(polymarketState.selectedMarketSlug || '').trim();
}

function setSelectedPolymarketMarketSlug(slug, emit = true) {
  const normalized = String(slug || '').trim();
  polymarketState.selectedMarketSlug = normalized;
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:polymarket-market-change', { detail: { slug: normalized || null } }));
  }
  return normalized;
}

function setPolymarketMarketHistory(slug, rows = []) {
  const key = String(slug || '').trim();
  if (!key) return;
  polymarketState.historyBySlug[key] = Array.isArray(rows) ? rows.slice() : [];
}

function isPhoneDetailMode() {
  return Boolean(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
}

function rememberPolymarketListScroll() {
  const listPage = document.getElementById('page-polymarket');
  if (!listPage) return;
  polymarketListScrollTop = Math.max(0, Number(listPage.scrollTop) || 0);
}

function restorePolymarketListScroll() {
  const listPage = document.getElementById('page-polymarket');
  if (!listPage) return;
  const nextTop = Math.max(0, Number(polymarketListScrollTop) || 0);
  window.requestAnimationFrame(() => {
    listPage.scrollTop = nextTop;
  });
}

function openPolymarketDetail(slug) {
  const normalized = setSelectedPolymarketMarketSlug(slug);
  if (!normalized) return;
  if (isPhoneDetailMode()) {
    rememberPolymarketListScroll();
    setActivePage('polymarket-detail', { force: true });
  }
  renderPolymarketDashboard();
}

function closePolymarketDetail(options = {}) {
  const restoreScroll = options.restoreScroll !== false;
  const hadSelection = Boolean(getSelectedPolymarketMarketSlug());
  setSelectedPolymarketMarketSlug('', false);

  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  if (detailBackdrop) detailBackdrop.hidden = true;
  if (detailSheet) {
    detailSheet.hidden = true;
    detailSheet.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('poly-detail-open', 'poly-mobile-detail-open');

  const detailPageActive = document.getElementById('page-polymarket-detail')?.classList.contains('active');
  if (isPhoneDetailMode() || detailPageActive) {
    setActivePage('polymarket', { force: true });
    if (restoreScroll) restorePolymarketListScroll();
  }

  if (hadSelection || detailPageActive) {
    renderPolymarketDashboard();
  }
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

function formatTimeAgo(value) {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  const ts = date.getTime();
  if (!Number.isFinite(ts)) return '--';

  const deltaMs = Date.now() - ts;
  const isFuture = deltaMs < 0;
  const absMs = Math.abs(deltaMs);

  if (absMs < 45000) {
    return isFuture ? 'soon' : 'just now';
  }

  const minutes = Math.round(absMs / 60000);
  if (minutes < 60) {
    return `${minutes}m ${isFuture ? 'from now' : 'ago'}`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${isFuture ? 'from now' : 'ago'}`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ${isFuture ? 'from now' : 'ago'}`;
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
  const isPolymarketPage = target === 'polymarket' || target === 'polymarket-detail';
  if (activeDashboardMode === 'polymarket' && !isPolymarketPage && !force) {
    target = 'polymarket';
  }
  if (!isPolymarketPage) {
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

function toMillisUi(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function buildPolymarketFreshnessSummary(feedStatus = {}) {
  const mode = String(feedStatus?.sourceMode || 'idle').toLowerCase();
  const sourceLabel = String(feedStatus?.sourceLabel || '').trim();
  const fetchedAt = feedStatus?.fetchedAt || null;
  const error = String(feedStatus?.error || '').trim();

  if (mode === 'live') {
    return fetchedAt
      ? `${sourceLabel || 'Live Gamma'} updated ${formatTimeAgo(fetchedAt)}`
      : (sourceLabel || 'Live Gamma active');
  }

  if (mode === 'fallback') {
    return `${sourceLabel || 'Supabase cache fallback'} ${fetchedAt ? formatTimeAgo(fetchedAt) : 'recently'}`;
  }

  if (mode === 'stale') {
    return `${sourceLabel || 'Holding last live values'} ${fetchedAt ? `from ${formatTimeAgo(fetchedAt)}` : ''}`.trim();
  }

  if (mode === 'error') {
    return error ? `Live feed error: ${error}` : 'Live feed unavailable';
  }

  return sourceLabel || 'Waiting for live feed';
}

function renderPolymarketRenderFailure(error, context = 'render') {
  const message = String(error?.message || error || 'Unknown render error').trim() || 'Unknown render error';
  console.error(`Polymarket ${context} error:`, error);

  const diagnosticsEl = document.getElementById('polymarket-diagnostics');
  const featuredEl = document.getElementById('polymarket-featured-market');
  const listEl = document.getElementById('polymarket-markets-list');
  const breakingEl = document.getElementById('polymarket-breaking-list');
  const hotTopicsEl = document.getElementById('polymarket-hot-topics');
  const spotlightEl = document.getElementById('polymarket-spotlight-strip');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  const detailTitleEl = document.getElementById('polymarket-detail-title');
  const detailBodyEl = document.getElementById('polymarket-detail-body');
  const detailPageTitleEl = document.getElementById('polymarket-detail-page-title');
  const detailPageBodyEl = document.getElementById('polymarket-detail-page-body');

  if (diagnosticsEl) {
    diagnosticsEl.textContent = `Polymarket render issue (${context}): ${message}`;
  }

  const fallbackMarkup = `
    <div class="empty-state">
      <div class="empty-state__title">Polymarket refresh hit a render issue</div>
      <div class="empty-state__sub">The dashboard will retry automatically. Latest error: ${escapeHtml(message)}</div>
    </div>
  `;

  if (featuredEl) featuredEl.innerHTML = fallbackMarkup;
  if (listEl) listEl.innerHTML = fallbackMarkup;
  if (breakingEl) breakingEl.innerHTML = '<div class="feature-note">Breaking markets are temporarily unavailable while the page recovers.</div>';
  if (hotTopicsEl) hotTopicsEl.innerHTML = '<div class="feature-note">Topics will return after the next successful refresh.</div>';
  if (spotlightEl) spotlightEl.innerHTML = '<div class="feature-note">Spotlight markets will return after the next successful refresh.</div>';

  if (detailBackdrop) detailBackdrop.hidden = true;
  if (detailSheet) {
    detailSheet.hidden = true;
    detailSheet.setAttribute('aria-hidden', 'true');
  }
  if (detailTitleEl) detailTitleEl.textContent = 'Polymarket detail unavailable';
  if (detailBodyEl) {
    detailBodyEl.innerHTML = '<div class="feature-note">Details will reappear after the next successful market render.</div>';
  }
  if (detailPageTitleEl) detailPageTitleEl.textContent = 'Polymarket detail unavailable';
  if (detailPageBodyEl) {
    detailPageBodyEl.innerHTML = '<div class="feature-note">Details will reappear after the next successful market render.</div>';
  }
  document.body.classList.remove('poly-detail-open', 'poly-mobile-detail-open');
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
  if (/(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)/.test(text)) return 'crypto';
  if (/(politics|election|president|senate|congress|minister|party|government|white house|parliament|trump|biden|campaign|vote|voting)/.test(text)) return 'politics';
  if (/(war|geopolitic|geopolitics|conflict|russia|ukraine|china|taiwan|israel|middle east|iran|sanction|ceasefire|military|nato|putin|xi jinping|gaza|hezbollah)/.test(text)) return 'geopolitics';
  if (/(fomc|fed|powell|rate|cpi|inflation|nfp|jobs|yield|treasury|tariff|economy|recession|gdp|finance|financial|stocks|nasdaq|s&p|dow|bond|dollar|usd|bitcoin|btc|ethereum|eth|solana|crypto|token|coin|doge|memecoin|altcoin|defi|etf)/.test(text)) return 'finance';
  return 'other';
}

function normalizePolymarketCategories(rawCategory, titleText = '', meta = null) {
  const visible = new Set();
  const fromMeta = Array.isArray(meta?.display_categories)
    ? meta.display_categories
    : Array.isArray(meta?.displayCategories)
      ? meta.displayCategories
      : [];

  fromMeta
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => POLY_CATEGORIES.includes(value) && value !== 'all')
    .forEach((value) => visible.add(value));

  const primary = normalizePolymarketCategory(rawCategory, titleText, meta);
  if (primary && primary !== 'other') {
    visible.add(primary);
  }

  const metaDisplay = String(meta?.display_category || meta?.displayCategory || '').trim().toLowerCase();
  const rawSource = String(meta?.raw_category || meta?.rawCategory || rawCategory || '').trim().toLowerCase();
  const text = `${metaDisplay} ${rawSource} ${String(titleText || '').toLowerCase()}`;

  if (/(breaking|urgent|headline|flash|developing|ceasefire|deal|meeting|summit|talks|diplomatic|sanction|attack|missile|war|conflict|tariff|fed|fomc|rate cut|rate hike|interest rate|election|vote|approval|ban|default|bankruptcy|merger|earnings)/.test(text)) {
    visible.add('breaking');
  }
  if (/(new|fresh|latest|launched|launch|recent)/.test(text)) {
    visible.add('new');
  }
  if (/(trending|trend|top volume|most active)/.test(text)) {
    visible.add('trending');
  }
  if (/(xauusd|xau|spot gold|gold price|bullion|precious metal)/.test(text)) {
    visible.add('xauusd');
  }
  if (/(oil|wti|brent|crude|opec|energy)/.test(text)) {
    visible.add('oil');
  }
  if (/(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)/.test(text)) {
    visible.add('crypto');
  }
  if (/(politics|election|president|senate|congress|minister|party|government|white house|parliament|trump|biden|campaign|vote|voting)/.test(text)) {
    visible.add('politics');
  }
  if (/(war|geopolitic|geopolitics|conflict|russia|ukraine|china|taiwan|israel|middle east|iran|sanction|ceasefire|military|nato|putin|xi jinping|gaza|hezbollah)/.test(text)) {
    visible.add('geopolitics');
  }
  if (/(fomc|fed|powell|rate|cpi|inflation|nfp|jobs|yield|treasury|tariff|economy|recession|gdp|finance|financial|stocks|nasdaq|s&p|dow|bond|dollar|usd|etf)/.test(text)) {
    visible.add('finance');
  }

  return Array.from(visible);
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
  const categories = normalizePolymarketCategories(row?.category, title, meta);
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
    category: category === 'other' && categories[0] ? categories[0] : category,
    categories,
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

function isPolymarketResolvedStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized.includes('resolved') || normalized.includes('closed') || normalized.includes('archived');
}

function isPolymarketActiveStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return true;
  if (isPolymarketResolvedStatus(normalized)) return false;
  return ['active', 'open', 'live'].includes(normalized) || !normalized.includes('inactive');
}

function filterPolymarketByView(markets, view) {
  const rows = Array.isArray(markets) ? markets.slice() : [];
  if (view === 'active') {
    return rows.filter((market) => isPolymarketActiveStatus(market.status));
  }
  if (view === 'ending') {
    return rows.filter((market) => isPolymarketActiveStatus(market.status)
      && Number.isFinite(market.hoursUntil)
      && market.hoursUntil >= 0
      && market.hoursUntil <= 72);
  }
  if (view === 'resolved') {
    return rows.filter((market) => isPolymarketResolvedStatus(market.status));
  }
  return rows;
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
  const detailClose = document.getElementById('polymarket-detail-close');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailPageBack = document.getElementById('polymarket-detail-page-back');
  const detailPageClose = document.getElementById('polymarket-detail-page-close');

  const savedCategory = localStorage.getItem(POLY_CATEGORY_KEY);
  const savedSort = localStorage.getItem(POLY_SORT_KEY);
  const savedView = localStorage.getItem(POLY_VIEW_KEY);
  const savedBetType = localStorage.getItem(POLY_BET_TYPE_KEY);
  setPolymarketCategory(savedCategory || 'all', { persist: false });
  setPolymarketSort(savedSort || 'volume', { persist: false });
  setPolymarketView(savedView || 'all', { persist: false });
  setPolymarketBetType(betTabs.length ? (savedBetType || 'all') : 'all', { persist: false });

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

  if (detailClose && !detailClose.dataset.bound) {
    detailClose.dataset.bound = '1';
    detailClose.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailBackdrop && !detailBackdrop.dataset.bound) {
    detailBackdrop.dataset.bound = '1';
    detailBackdrop.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailPageBack && !detailPageBack.dataset.bound) {
    detailPageBack.dataset.bound = '1';
    detailPageBack.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailPageClose && !detailPageClose.dataset.bound) {
    detailPageClose.dataset.bound = '1';
    detailPageClose.addEventListener('click', () => closePolymarketDetail());
  }

  if (!window.__polyDetailEscBound) {
    window.__polyDetailEscBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!getSelectedPolymarketMarketSlug()) return;
      if (isPhoneDetailMode()) return;
      closePolymarketDetail();
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

function getPreferredLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  const cookie = getCurrentGoogTrans();
  if (saved === 'zh-CN' || cookie.includes('/zh-CN')) {
    return 'zh-CN';
  }
  return 'en';
}

function applyTranslateToggleLabel(btn, lang) {
  if (!btn) return;
  btn.textContent = lang === 'zh-CN' ? 'EN' : '中文';
  btn.setAttribute('aria-label', lang === 'zh-CN' ? 'Switch language to English' : 'Switch language to Chinese');
}

function ensureGoogleTranslateWidget() {
  if (googleTranslateLoader) return googleTranslateLoader;

  googleTranslateLoader = new Promise((resolve) => {
    const container = document.getElementById('google_translate_element');
    if (!container) {
      console.warn('Google Translate container is missing.');
      resolve(false);
      return;
    }

    const initWidget = () => {
      try {
        if (!window.google?.translate?.TranslateElement) {
          console.warn('Google Translate API is unavailable after script load.');
          resolve(false);
          return;
        }

        if (!container.dataset.ready) {
          container.innerHTML = '';
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,zh-CN',
              autoDisplay: false,
              multilanguagePage: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            'google_translate_element'
          );
          container.dataset.ready = '1';
        }

        window.setTimeout(() => resolve(true), 150);
      } catch (err) {
        console.warn('Failed to initialize Google Translate widget:', err?.message || err);
        resolve(false);
      }
    };

    if (window.google?.translate?.TranslateElement) {
      initWidget();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID);
    window[GOOGLE_TRANSLATE_CALLBACK] = initWidget;

    if (existingScript) {
      window.setTimeout(() => {
        if (window.google?.translate?.TranslateElement) {
          initWidget();
        } else {
          console.warn('Google Translate script is present but widget did not initialize.');
          resolve(false);
        }
      }, 800);
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_TRANSLATE_CALLBACK}`;
    script.onerror = () => {
      console.warn('Google Translate script failed to load.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleTranslateLoader;
}

function syncGoogleTranslateLanguage(lang) {
  const normalized = lang === 'zh-CN' ? 'zh-CN' : 'en';
  setGoogTransCookie(normalized === 'zh-CN' ? '/en/zh-CN' : '/en/en');

  const combo = document.querySelector('#google_translate_element select.goog-te-combo');
  if (!combo) return false;

  if (combo.value !== normalized) {
    combo.value = normalized;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    combo.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
}

async function applyTranslateLanguage(lang, { persist = true } = {}) {
  const normalized = lang === 'zh-CN' ? 'zh-CN' : 'en';
  const btn = document.getElementById('translate-toggle');
  if (persist) {
    localStorage.setItem(LANG_KEY, normalized);
  }
  applyTranslateToggleLabel(btn, normalized);

  const ready = await ensureGoogleTranslateWidget();
  if (!ready) {
    console.warn('Google Translate widget is unavailable; keeping readable toggle only.');
    return false;
  }

  const synced = syncGoogleTranslateLanguage(normalized);
  if (!synced) {
    console.warn('Google Translate widget did not expose the language selector.');
    return false;
  }
  return true;
}

function initTranslateToggle() {
  const btn = document.getElementById('translate-toggle');
  if (!btn) return;

  let lang = getPreferredLanguage();
  applyTranslateToggleLabel(btn, lang);
  applyTranslateLanguage(lang, { persist: false });

  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', async () => {
    const next = lang === 'zh-CN' ? 'en' : 'zh-CN';
    btn.disabled = true;
    try {
      const ok = await applyTranslateLanguage(next);
      lang = next;
      if (!ok) {
        applyTranslateToggleLabel(btn, next);
      }
    } finally {
      btn.disabled = false;
    }
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
  const weekday = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const marketOpen = !(
    weekday === 6
    || (weekday === 0 && total < 22 * 60)
    || (weekday === 5 && total >= 22 * 60)
  );

  const sessions = [
    { name: 'Sydney', start: 21 * 60, end: 30 * 60, color: '#4f8cff' },
    { name: 'Tokyo', start: 0, end: 9 * 60, color: '#8b6eff' },
    { name: 'London', start: 7 * 60, end: 16 * 60, color: '#1fca77' },
    { name: 'New York', start: 12 * 60, end: 21 * 60, color: '#ef5d6c' },
  ];

  let active = null;
  if (marketOpen) {
    for (const s of sessions) {
      const start = s.start % (24 * 60);
      const end = s.end % (24 * 60);
      const inside = start < end ? total >= start && total < end : total >= start || total < end;
      if (inside) {
        active = s;
        break;
      }
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

  const toValidTs = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    const ts = date.getTime();
    return Number.isFinite(ts) ? ts : null;
  };
  const formatLastUpdatedText = (value) => {
    const ts = toValidTs(value);
    if (!ts) return 'Last updated: waiting for signal engine';
    return `Last updated: ${formatMalaysiaTime(ts, true)} | ${formatTimeAgo(ts)}`;
  };

  const selectedLane = getSelectedSignalLane();
  const lanes = ['intraday', 'swing'];
  const laneModels = lanes.map((lane) => {
    const activeSignal = signalsByLane?.[lane] || null;
    const decision = decisionRun?.lanes?.[lane] || null;
    return activeSignal
      ? { ...(decision || {}), ...activeSignal, decision_state: decision?.decision_state || 'IN_TRADE', lane }
      : decision;
  }).filter(Boolean);
  const freshestUpdateTs = [decisionRun?.created_at]
    .concat(laneModels.flatMap((signal) => [signal?.monitor_updated_at, signal?.created_at]))
    .map(toValidTs)
    .filter((ts) => ts !== null)
    .reduce((latest, ts) => Math.max(latest, ts), 0);
  const lastUpdatedText = formatLastUpdatedText(freshestUpdateTs || null);

  if (laneModels.length === 0) {
    hero.innerHTML = `
      <div class="signal-hero__badge waiting">Waiting for lane decisions...</div>
      <div class="signal-hero__time">${lastUpdatedText}</div>
    `;
    return;
  }

  hero.innerHTML = `
    <div class="signal-hero__time">${lastUpdatedText}</div>
    <div class="signal-hero-grid">
      ${lanes.map((lane) => {
        const expanded = isSignalLaneExpanded(lane);
        const signal = laneModels.find((row) => String(row.lane || '').toLowerCase() === lane) || null;
        if (!signal) {
          return `
            <article
              class="signal-lane-card signal-lane-card--empty signal-lane-card--collapsed ${selectedLane === lane ? 'is-selected' : ''}"
              data-lane="${lane}"
              role="button"
              tabindex="0"
              aria-expanded="false"
            >
              <div class="signal-lane-card__top">
                <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
                <span class="signal-lane-card__state">WAITING</span>
              </div>
              <div class="signal-lane-card__side waiting">NO TRADE</div>
              <div class="signal-lane-card__reason">No lane decision yet.</div>
            </article>
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
        const compactHint = tradable
          ? 'Signal active'
          : decisionState === 'NOT_READY'
            ? 'Watching setup'
            : 'Awaiting next engine update';

        return `
          <article
            class="signal-lane-card ${selectedLane === lane ? 'is-selected' : ''} ${expanded ? 'signal-lane-card--expanded' : 'signal-lane-card--collapsed'}"
            data-lane="${lane}"
            role="button"
            tabindex="0"
            aria-expanded="${expanded ? 'true' : 'false'}"
          >
            <div class="signal-lane-card__top">
              <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
              <div class="signal-lane-card__controls">
                <span class="signal-lane-card__state">${decisionState === 'IN_TRADE' ? 'IN TRADE' : decisionState}</span>
                <button type="button" class="signal-lane-card__toggle" data-lane-toggle="${lane}" aria-label="${expanded ? 'Hide signal details' : 'Expand signal details'}">
                  ${expanded ? 'Hide' : 'Expand'}
                </button>
              </div>
            </div>
            <div class="signal-lane-card__side ${badgeClass}">${sideLabel}</div>
            ${expanded ? `
              <div class="signal-lane-card__headline">${lane === 'swing' ? 'Swing market signal' : 'Intraday market signal'}</div>
              <div class="signal-lane-card__reason">${reasonText}</div>
            ` : `
              <div class="signal-lane-card__summary-grid">
                <div class="signal-lane-card__summary-stat">
                  <span class="signal-lane-card__summary-label">Score</span>
                  <strong class="signal-lane-card__summary-value ${scoreClass}">${scoreNum.toFixed(1)}</strong>
                </div>
                <div class="signal-lane-card__summary-stat">
                  <span class="signal-lane-card__summary-label">Confidence</span>
                  <strong class="signal-lane-card__summary-value ${confClass}">${confNum.toFixed(0)}%</strong>
                </div>
              </div>
              <div class="signal-lane-card__summary">${compactHint}</div>
            `}
            <div class="signal-lane-card__details" ${expanded ? '' : 'hidden'}>
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
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  hero.querySelectorAll('.signal-lane-card[data-lane]').forEach((card) => {
    card.addEventListener('click', () => setSelectedSignalLane(card.dataset.lane));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedSignalLane(card.dataset.lane);
      }
    });
  });
  hero.querySelectorAll('[data-lane-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSignalLaneExpanded(btn.dataset.laneToggle);
      renderSignalHero(decisionRun, signalsByLane, currentPrice);
    });
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
  const visibleSignals = Array.isArray(signals)
    ? signals.filter((s) => String(s.status || '').toUpperCase() !== 'REJECTED')
    : [];

  if (!visibleSignals || visibleSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No signal history yet</div>
        <div class="empty-state__sub">Active, breakeven, expired, TP, and SL signals will appear here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleSignals.map((s) => {
    const type = s.signal_type || s.type || 'WAIT';
    const entry = parseFloat(s.entry_price) || 0;
    const conf = s.confidence || 0;
    const score = Number(s.score_total || 0).toFixed(1);
    const lane = (s.lane || 'intraday').toUpperCase();
    const blockedReason = s.blocked_reason || '';
    const time = formatMalaysiaTime(s.created_at);
    const statusRaw = String(s.status || 'ACTIVE').toUpperCase();
    const status = statusRaw.replace(/_/g, ' ');

    let statusCls = 'active';
    if (statusRaw.startsWith('HIT_TP')) statusCls = 'hit-tp';
    if (statusRaw === 'HIT_SL') statusCls = 'hit-sl';
    if (statusRaw === 'BREAKEVEN' || statusRaw === 'EXPIRED') statusCls = 'expired';

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

function getPolymarketStatusText(market) {
  if (String(market?.status || '').includes('resolved')) return 'RESOLVED';
  if (String(market?.status || '').includes('closed')) return 'CLOSED';
  return 'ACTIVE';
}

function getPolymarketStatusClass(market) {
  if (String(market?.status || '').includes('resolved')) return 'status-resolved';
  if (String(market?.status || '').includes('closed')) return 'status-closed';
  return 'status-active';
}

function getPolymarketCategoryLabel(market) {
  const categories = Array.isArray(market?.categories) ? market.categories : [];
  const primary = categories.find((category) => !['all', 'trending', 'breaking', 'new'].includes(category))
    || market?.category
    || 'other';
  return POLY_LABELS[primary] || String(primary || 'Other').toUpperCase();
}

function getPolymarketEndText(market) {
  if (!market?.endDate) return '--';
  if (Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0) {
    return market.hoursUntil < 24 ? `${market.hoursUntil.toFixed(1)}h left` : `${Math.ceil(market.hoursUntil / 24)}d left`;
  }
  if (Number.isFinite(market.hoursUntil) && market.hoursUntil < 0) return 'Ended';
  return formatMalaysiaTime(market.endDate, true);
}

function buildPolymarketHistoryChartMarkup(historyRows = [], market = null) {
  const rows = Array.isArray(historyRows) ? historyRows : [];
  const points = rows.map((row) => {
    const yes = clamp01To100(normalizePercent(row?.yes_price ?? row?.probability));
    const ts = toMillisUi(row?.provider_ts || row?.created_at || row?.updated_at || row?.captured_at);
    return Number.isFinite(yes) && Number.isFinite(ts) ? { yes, ts } : null;
  }).filter(Boolean).sort((a, b) => a.ts - b.ts);

  if (!points.length && market && Number.isFinite(market.yesPct)) {
    points.push({ yes: market.yesPct, ts: toMillisUi(market.provider_ts) || Date.now() });
  }

  if (points.length < 2) {
    const single = points[0];
    return `
      <div class="poly-detail-history__empty">
        <div class="feature-note">${single ? `Latest probability snapshot: ${single.yes.toFixed(1)}% YES.` : 'Probability history will appear once snapshots are available.'}</div>
      </div>
    `;
  }

  const width = 760;
  const height = 220;
  const padX = 10;
  const padY = 14;
  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const spanTs = Math.max(1, maxTs - minTs);
  const polyline = points.map((point) => {
    const x = padX + ((point.ts - minTs) / spanTs) * (width - padX * 2);
    const y = padY + ((100 - point.yes) / 100) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const latest = points[points.length - 1];
  const earliest = points[0];
  const high = points.reduce((max, point) => Math.max(max, point.yes), -Infinity);
  const low = points.reduce((min, point) => Math.min(min, point.yes), Infinity);
  const delta = latest.yes - earliest.yes;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`;

  return `
    <div class="poly-detail-history">
      <div class="poly-detail-history__stats">
        <span>Latest ${latest.yes.toFixed(1)}%</span>
        <span>High ${high.toFixed(1)}%</span>
        <span>Low ${low.toFixed(1)}%</span>
        <span>${deltaLabel}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="poly-detail-history__chart" role="img" aria-label="Probability history chart">
        <defs>
          <linearGradient id="poly-history-line" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stop-color="#39c17f"></stop>
            <stop offset="100%" stop-color="#2d8cff"></stop>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" class="poly-detail-history__midline"></line>
        <polyline points="${polyline}" class="poly-detail-history__line"></polyline>
      </svg>
      <div class="poly-detail-history__axis">
        <span>${escapeHtml(formatMalaysiaTime(minTs, true))}</span>
        <span>${escapeHtml(formatMalaysiaTime(maxTs, true))}</span>
      </div>
    </div>
  `;
}

function renderPolymarketDashboard(btcTick, feedOrMarkets) {
  try {
    if (btcTick !== undefined) {
      polymarketState.btcTick = btcTick || null;
    }
    if (feedOrMarkets !== undefined) {
      if (Array.isArray(feedOrMarkets)) {
        const nextMarkets = feedOrMarkets.map(normalizePolymarketRow).filter(Boolean);
        if (nextMarkets.length || !Array.isArray(polymarketState.markets) || !polymarketState.markets.length) {
          polymarketState.markets = nextMarkets;
        }
        polymarketState.fallbackMarkets = nextMarkets;
        if (!polymarketState.slices || typeof polymarketState.slices !== 'object') {
          polymarketState.slices = { trending: [], breaking: [], new: [] };
        }
        polymarketState.feedStatus = {
          ...polymarketState.feedStatus,
          sourceMode: 'fallback',
          sourceLabel: 'Supabase cache',
        };
      } else if (feedOrMarkets && typeof feedOrMarkets === 'object') {
        const feed = feedOrMarkets;
        const nextMarkets = Array.isArray(feed.markets) ? feed.markets.map(normalizePolymarketRow).filter(Boolean) : [];
        const previousSlices = polymarketState.slices && typeof polymarketState.slices === 'object'
          ? polymarketState.slices
          : { trending: [], breaking: [], new: [] };
        const nextSlices = {
          trending: Array.isArray(feed.slices?.trending) ? feed.slices.trending.map(normalizePolymarketRow).filter(Boolean) : [],
          breaking: Array.isArray(feed.slices?.breaking) ? feed.slices.breaking.map(normalizePolymarketRow).filter(Boolean) : [],
          new: Array.isArray(feed.slices?.new) ? feed.slices.new.map(normalizePolymarketRow).filter(Boolean) : [],
        };
        polymarketState.fallbackMarkets = Array.isArray(feed.fallbackMarkets)
          ? feed.fallbackMarkets.map(normalizePolymarketRow).filter(Boolean)
          : (polymarketState.fallbackMarkets || []);
        if (nextMarkets.length || !Array.isArray(polymarketState.markets) || !polymarketState.markets.length) {
          polymarketState.markets = nextMarkets;
        }
        polymarketState.slices = {
          trending: nextSlices.trending.length ? nextSlices.trending : (previousSlices.trending || []),
          breaking: nextSlices.breaking.length ? nextSlices.breaking : (previousSlices.breaking || []),
          new: nextSlices.new.length ? nextSlices.new : (previousSlices.new || []),
        };
        polymarketState.feedStatus = {
          liveOk: Boolean(feed.liveOk),
          fallbackUsed: Boolean(feed.fallbackUsed),
          sourceMode: String(feed.sourceMode || 'idle'),
          sourceLabel: String(feed.sourceLabel || 'Waiting for live feed'),
          fetchedAt: feed.fetchedAt || null,
          error: String(feed.error || ''),
        };
      }
    }

  const activeBtc = polymarketState.btcTick;
  const rawMarkets = Array.isArray(polymarketState.markets) ? polymarketState.markets : [];
  const fallbackMarkets = Array.isArray(polymarketState.fallbackMarkets) ? polymarketState.fallbackMarkets : [];
  const renderableMarkets = (rawMarkets.length ? rawMarkets : fallbackMarkets).filter(Boolean);
  const categorizedMarkets = renderableMarkets.filter((row) => Array.isArray(row.categories) && row.categories.some((cat) => POLY_CATEGORIES.includes(cat) && cat !== 'all'));
  const unmatchedCount = Math.max(0, renderableMarkets.length - categorizedMarkets.length);
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
    recent: (a, b) => (toMillisUi(b.provider_ts) || 0) - (toMillisUi(a.provider_ts) || 0),
  };
  const allActiveMarkets = renderableMarkets.filter((market) => isPolymarketActiveStatus(market.status)).slice().sort(sorters.volume);
  const breakingFallback = allActiveMarkets.filter((market) => {
    const text = `${market.title} ${(market.categories || []).join(' ')} ${market.rawCategory || ''}`.toLowerCase();
    return (market.categories || []).includes('breaking') || /(breaking|urgent|headline|flash|developing|war|ceasefire|meeting|tariff|fed|rate cut|diplomatic|summit)/.test(text);
  }).slice(0, 8);
  const newFallback = allActiveMarkets.slice().sort(sorters.recent).slice(0, 12);
  const trendingSlice = (polymarketState.slices.trending.length ? polymarketState.slices.trending : allActiveMarkets.slice(0, 24)).slice().sort(sorters.volume);
  const breakingSlice = (polymarketState.slices.breaking.length ? polymarketState.slices.breaking : breakingFallback).slice().sort(sorters.volume);
  const newSlice = (polymarketState.slices.new.length ? polymarketState.slices.new : newFallback).slice().sort(sorters.recent);
  const selectedSlug = getSelectedPolymarketMarketSlug();

  const activeCategory = polymarketState.category;
  const activeSort = polymarketState.sort;
  const activeQuery = polymarketState.query;
  const activeView = polymarketState.view;
  const activeBetType = polymarketState.betType;

  const tabButtons = Array.from(document.querySelectorAll('#polymarket-tabs .poly-tab'));
  const viewButtons = Array.from(document.querySelectorAll('#polymarket-view-nav .poly-view-tab'));
  const categoryCounts = {
    all: renderableMarkets.length,
    trending: trendingSlice.length,
    breaking: breakingSlice.length,
    new: newSlice.length,
  };
  categorizedMarkets.forEach((market) => {
    const categories = Array.isArray(market.categories) ? market.categories : [];
    categories.forEach((category) => {
      if (POLY_CATEGORIES.includes(category) && !['all', 'trending', 'breaking', 'new'].includes(category)) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });
  tabButtons.forEach((btn) => {
    const category = String(btn.dataset.category || 'all').toLowerCase();
    const isActive = category === activeCategory;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    setAnimatedButtonCount(btn, `poly-tab:${category}`, baseLabel, Number(categoryCounts[category] || 0));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  const categoryPools = {
    all: renderableMarkets.slice(),
    trending: trendingSlice.slice(),
    breaking: breakingSlice.slice(),
    new: newSlice.slice(),
    politics: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('politics')),
    crypto: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('crypto')),
    finance: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('finance')),
    geopolitics: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('geopolitics')),
    oil: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('oil')),
    xauusd: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('xauusd')),
  };
  const filterByQuery = (markets) => {
    if (!activeQuery) return markets.slice();
    return markets.filter((market) => {
      const haystack = `${market.title} ${market.category} ${(market.categories || []).join(' ')} ${market.status} ${market.marketType}`.toLowerCase();
      return haystack.includes(activeQuery);
    });
  };
  const filterByBetType = (markets) => {
    if (!activeBetType || activeBetType === 'all') return markets.slice();
    return markets.filter((market) => market.marketType === activeBetType);
  };
  const canonicalBaseMarkets = filterByBetType(filterByQuery(categoryPools[activeCategory] || categoryPools.all));

  const viewCounts = {
    all: canonicalBaseMarkets.length,
    active: filterPolymarketByView(canonicalBaseMarkets, 'active').length,
    ending: filterPolymarketByView(canonicalBaseMarkets, 'ending').length,
    resolved: filterPolymarketByView(canonicalBaseMarkets, 'resolved').length,
  };
  viewButtons.forEach((btn) => {
    const view = String(btn.dataset.view || 'all').toLowerCase();
    const isActive = view === activeView;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    setAnimatedButtonCount(btn, `poly-view:${view}`, baseLabel, Number(viewCounts[view] || 0));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const visibleMarkets = filterPolymarketByView(canonicalBaseMarkets, activeView).slice().sort(sorters[activeSort] || sorters.volume);
  const featuredMarket = visibleMarkets.find((market) => isPolymarketActiveStatus(market.status))
    || canonicalBaseMarkets.find((market) => isPolymarketActiveStatus(market.status))
    || visibleMarkets[0]
    || canonicalBaseMarkets[0]
    || allActiveMarkets[0]
    || renderableMarkets[0]
    || null;
  const spotlightSource = visibleMarkets.length
    ? visibleMarkets
    : canonicalBaseMarkets.length
      ? canonicalBaseMarkets
      : (activeCategory === 'breaking' ? breakingSlice : activeCategory === 'new' ? newSlice : trendingSlice);
  const spotlightMarkets = spotlightSource
    .filter((market) => !featuredMarket || market.market_slug !== featuredMarket.market_slug)
    .slice(0, 4);
  const selectedMarket = selectedSlug
    ? (renderableMarkets.find((market) => market.market_slug === selectedSlug)
      || trendingSlice.find((market) => market.market_slug === selectedSlug)
      || breakingSlice.find((market) => market.market_slug === selectedSlug)
      || newSlice.find((market) => market.market_slug === selectedSlug)
      || null)
    : null;
  const topicRows = POLY_CATEGORIES
    .filter((category) => !['all', 'trending', 'breaking', 'new'].includes(category))
    .map((category) => {
      const rows = allActiveMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes(category));
      return {
        category,
        label: POLY_LABELS[category] || category,
        count: rows.length,
        volume: rows.reduce((sum, row) => sum + (Number.isFinite(row.volume) ? row.volume : 0), 0),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || b.volume - a.volume)
    .slice(0, 6);

  const btcPriceEl = document.getElementById('polymarket-btc-price');
  const btcChangeEl = document.getElementById('polymarket-btc-change');
  const syncEl = document.getElementById('polymarket-last-sync');
  const livePillEl = document.getElementById('polymarket-live-pill');
  const kpiCountEl = document.getElementById('polymarket-kpi-count');
  const kpiVolEl = document.getElementById('polymarket-kpi-volume');
  const kpiEndingEl = document.getElementById('polymarket-kpi-ending');
  const diagnosticsEl = document.getElementById('polymarket-diagnostics');
  const listEl = document.getElementById('polymarket-markets-list');
  const breakingEl = document.getElementById('polymarket-breaking-list');
  const hotTopicsEl = document.getElementById('polymarket-hot-topics');
  const featuredEl = document.getElementById('polymarket-featured-market');
  const spotlightEl = document.getElementById('polymarket-spotlight-strip');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  const detailTitleEl = document.getElementById('polymarket-detail-title');
  const detailBodyEl = document.getElementById('polymarket-detail-body');
  const detailPageEl = document.getElementById('page-polymarket-detail');
  const detailPageTitleEl = document.getElementById('polymarket-detail-page-title');
  const detailPageBodyEl = document.getElementById('polymarket-detail-page-body');

  if (btcPriceEl) {
    if (!activeBtc || !Number.isFinite(Number(activeBtc.price))) {
      setAnimatedContent(btcPriceEl, 'poly:btc:price', '$--');
      btcPriceEl.className = 'polymarket-btc__price';
    } else {
      const price = Number(activeBtc.price);
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      btcPriceEl.className = `polymarket-btc__price ${Number.isFinite(change24h) ? (change24h >= 0 ? 'up' : 'down') : ''}`.trim();
      setAnimatedContent(btcPriceEl, 'poly:btc:price', `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, { numericValue: price });
    }
  }
  if (btcChangeEl) {
    if (!activeBtc) {
      setAnimatedContent(btcChangeEl, 'poly:btc:change', 'Waiting for feed...');
    } else {
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      if (Number.isFinite(change24h)) {
        const sign = change24h >= 0 ? '+' : '-';
        const icon = change24h >= 0 ? '\u25B2' : '\u25BC';
        setAnimatedContent(btcChangeEl, 'poly:btc:change', `${icon} ${sign}${Math.abs(change24h).toFixed(2)}% (24h)`, { numericValue: change24h });
      } else {
        setAnimatedContent(btcChangeEl, 'poly:btc:change', '24h change unavailable');
      }
    }
  }
  if (syncEl) {
    const ts = polymarketState.feedStatus.fetchedAt || activeBtc?.provider_ts || activeBtc?.created_at || null;
    syncEl.textContent = ts ? `Last sync: ${formatMalaysiaTime(ts, true)}` : 'Last sync: --';
  }
  if (livePillEl) {
    livePillEl.textContent = polymarketState.feedStatus.sourceLabel || 'Live Gamma';
    livePillEl.classList.remove('poly-live-pill--fallback', 'poly-live-pill--stale');
    if (polymarketState.feedStatus.sourceMode === 'fallback') {
      livePillEl.classList.add('poly-live-pill--fallback');
    } else if (['stale', 'error'].includes(polymarketState.feedStatus.sourceMode)) {
      livePillEl.classList.add('poly-live-pill--stale');
    }
  }

  setAnimatedContent(kpiCountEl, 'poly:kpi:count', String(visibleMarkets.length), { numericValue: visibleMarkets.length });
  setAnimatedContent(
    kpiVolEl,
    'poly:kpi:volume',
    formatCompactUsd(visibleMarkets.reduce((sum, market) => sum + (Number.isFinite(market.volume) ? market.volume : 0), 0)),
    { numericValue: visibleMarkets.reduce((sum, market) => sum + (Number.isFinite(market.volume) ? market.volume : 0), 0) }
  );
  setAnimatedContent(
    kpiEndingEl,
    'poly:kpi:ending',
    String(visibleMarkets.filter((market) => isPolymarketActiveStatus(market.status) && Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0 && market.hoursUntil <= 48).length),
    { numericValue: visibleMarkets.filter((market) => isPolymarketActiveStatus(market.status) && Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0 && market.hoursUntil <= 48).length }
  );
  if (diagnosticsEl) {
    diagnosticsEl.textContent = `${buildPolymarketFreshnessSummary(polymarketState.feedStatus)} | Loaded ${categorizedMarkets.length} mapped markets | ${unmatchedCount} unmatched`;
  }

  if (getDashboardMode() === 'polymarket') {
    const headerPrice = document.getElementById('header-price');
    const headerChange = document.getElementById('header-change');
    if (headerPrice) {
      if (activeBtc && Number.isFinite(Number(activeBtc.price))) {
        const price = Number(activeBtc.price);
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        headerPrice.className = `topbar__price ${Number.isFinite(chg) ? (chg >= 0 ? 'up' : 'down') : 'neutral'}`;
        setAnimatedContent(headerPrice, 'poly:topbar:price', `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, { numericValue: price });
      } else {
        headerPrice.className = 'topbar__price neutral';
        setAnimatedContent(headerPrice, 'poly:topbar:price', '$--');
      }
    }
    if (headerChange) {
      if (activeBtc) {
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        const ts = polymarketState.feedStatus.fetchedAt || activeBtc.provider_ts || activeBtc.created_at;
        const age = ts ? `Updated ${formatMalaysiaTime(ts, true)}` : 'Updated --';
        setAnimatedContent(
          headerChange,
          'poly:topbar:change',
          Number.isFinite(chg) ? `BTC 24h: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% | ${age}` : `BTC 24h: -- | ${age}`,
          { numericValue: chg }
        );
      } else {
        setAnimatedContent(headerChange, 'poly:topbar:change', 'Waiting for BTC feed');
      }
    }
  }

  const iconByCategory = {
    trending: 'Tr',
    breaking: 'Br',
    new: 'Nw',
    politics: 'Po',
    crypto: '₿',
    finance: 'Fi',
    oil: 'Oi',
    geopolitics: 'Ge',
    xauusd: 'Au',
  };
  const buildMarketTriggerAttr = (market) => `data-poly-open-market="${escapeHtml(market.market_slug)}"`;
  const buildProbabilityCells = (market, keyPrefix, size = 'default') => {
    const yesPctText = Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(size === 'featured' ? 0 : 1)}%` : '--';
    const noPctText = Number.isFinite(market.noPct) ? `${market.noPct.toFixed(size === 'featured' ? 0 : 1)}%` : '--';
    const yesText = Number.isFinite(market.yesPct) ? `${Math.round(market.yesPct)}c` : '--';
    const noText = Number.isFinite(market.noPct) ? `${Math.round(market.noPct)}c` : '--';
    return {
      yesPctText,
      noPctText,
      yesText,
      noText,
      yesPctMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:yes-pct`, yesPctText, market.yesPct, 'span', size === 'featured' ? 'poly-featured-odd__pct' : 'poly-odd__pct'),
      noPctMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:no-pct`, noPctText, market.noPct, 'span', size === 'featured' ? 'poly-featured-odd__pct' : 'poly-odd__pct'),
      yesValueMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:yes-value`, yesText, market.yesPct, 'span', size === 'featured' ? 'poly-featured-odd__value' : 'poly-odd__value'),
      noValueMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:no-value`, noText, market.noPct, 'span', size === 'featured' ? 'poly-featured-odd__value' : 'poly-odd__value'),
    };
  };
  const buildPolymarketDetailBodyMarkup = (market) => {
    if (!market) {
      return '<div class="feature-note">Choose a market card to inspect its detail.</div>';
    }
    const categoryLine = (market.categories || [])
      .filter((category) => category !== 'all')
      .map((category) => POLY_LABELS[category] || category)
      .join(' • ');
    const historyRows = polymarketState.historyBySlug[market.market_slug] || [];
    const detailOdds = buildProbabilityCells(market, `poly:detail:${market.market_slug}`, 'featured');
    return `
      <section class="poly-detail-section">
        <div class="poly-detail-badges">
          <span class="polymarket-card__status ${getPolymarketStatusClass(market)}">${getPolymarketStatusText(market)}</span>
          <span class="poly-detail-chip">${escapeHtml(categoryLine || getPolymarketCategoryLabel(market))}</span>
          <span class="poly-detail-chip">${escapeHtml(POLY_MARKET_TYPE_LABELS[market.marketType] || 'General')}</span>
          <span class="poly-detail-chip">${escapeHtml(getPolymarketEndText(market))}</span>
        </div>
        <div class="poly-detail-odds">
          <div class="poly-featured-odd poly-featured-odd--yes">
            <span class="poly-featured-odd__name">Yes</span>
            ${detailOdds.yesPctMarkup}
            ${detailOdds.yesValueMarkup}
          </div>
          <div class="poly-featured-odd poly-featured-odd--no">
            <span class="poly-featured-odd__name">No</span>
            ${detailOdds.noPctMarkup}
            ${detailOdds.noValueMarkup}
          </div>
        </div>
      </section>
      <section class="poly-detail-section poly-detail-grid">
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Volume</span>
          <strong>${formatCompactUsd(market.volume)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Liquidity</span>
          <strong>${formatCompactUsd(market.liquidity)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Last sync</span>
          <strong>${escapeHtml(formatMalaysiaTime(market.provider_ts || polymarketState.feedStatus.fetchedAt, true) || '--')}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Source</span>
          <strong>${escapeHtml(polymarketState.feedStatus.sourceLabel || 'Live Gamma')}</strong>
        </div>
      </section>
      <section class="poly-detail-section">
        <div class="poly-detail-section__title">Probability history</div>
        ${buildPolymarketHistoryChartMarkup(historyRows, market)}
      </section>
      <section class="poly-detail-section poly-detail-grid">
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Market slug</span>
          <strong>${escapeHtml(market.market_slug)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Display freshness</span>
          <strong>${escapeHtml(buildPolymarketFreshnessSummary(polymarketState.feedStatus))}</strong>
        </div>
      </section>
    `;
  };

  if (breakingEl) {
    if (!breakingSlice.length) {
      breakingEl.innerHTML = '<div class="feature-note">No breaking markets yet.</div>';
    } else {
      breakingEl.innerHTML = breakingSlice.slice(0, 6).map((market, index) => `
        <article class="poly-side-item poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <span class="poly-side-item__rank">${index + 1}</span>
          <div class="poly-side-item__body">
            <div class="poly-side-item__title">${escapeHtml(market.title)}</div>
            <div class="poly-side-item__meta">${escapeHtml(getPolymarketCategoryLabel(market))} | ${escapeHtml(formatCompactUsd(market.volume))}</div>
          </div>
          ${buildAnimatedInlineMarkup(`poly:breaking:${market.market_slug}:yes`, Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(0)}%` : '--', market.yesPct, 'span', 'poly-side-item__prob')}
        </article>
      `).join('');
      applyAnimatedValues(breakingEl);
    }
  }

  if (hotTopicsEl) {
    if (!topicRows.length) {
      hotTopicsEl.innerHTML = '<div class="feature-note">Topics will appear here automatically.</div>';
    } else {
      hotTopicsEl.innerHTML = topicRows.map((topic) => `
        <button type="button" class="poly-topic-card ${topic.category === activeCategory ? 'active' : ''}" data-poly-topic="${topic.category}">
          <span class="poly-topic-card__label">${escapeHtml(topic.label)}</span>
          <span class="poly-topic-card__meta">${topic.count} mkts | ${escapeHtml(formatCompactUsd(topic.volume))}</span>
        </button>
      `).join('');
      hotTopicsEl.querySelectorAll('[data-poly-topic]').forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
          setPolymarketCategory(btn.dataset.polyTopic || 'all');
          renderPolymarketDashboard();
        });
      });
    }
  }

  if (featuredEl) {
    if (!featuredMarket) {
      featuredEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No featured market yet</div>
          <div class="empty-state__sub">Try another category or wait for the next refresh.</div>
        </div>
      `;
    } else {
      const odds = buildProbabilityCells(featuredMarket, `poly:featured:${featuredMarket.market_slug}`, 'featured');
      const categoryLine = (featuredMarket.categories || [])
        .filter((category) => category !== 'all')
        .slice(0, 3)
        .map((category) => POLY_LABELS[category] || category)
        .join(' • ');
      featuredEl.innerHTML = `
        <article class="poly-featured-card__panel poly-market-trigger" ${buildMarketTriggerAttr(featuredMarket)}>
          <div class="poly-featured-card__head">
            <div>
              <div class="poly-featured-card__eyebrow">${escapeHtml(categoryLine || getPolymarketCategoryLabel(featuredMarket))}</div>
              <h3 class="poly-featured-card__title">${escapeHtml(featuredMarket.title)}</h3>
            </div>
            <span class="polymarket-card__status ${getPolymarketStatusClass(featuredMarket)}">${getPolymarketStatusText(featuredMarket)}</span>
          </div>
          <div class="poly-featured-card__body">
            <div class="poly-featured-card__pricing">
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Volume</span>
                <span class="poly-featured-stat__value">${formatCompactUsd(featuredMarket.volume)}</span>
              </div>
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Liquidity</span>
                <span class="poly-featured-stat__value">${formatCompactUsd(featuredMarket.liquidity)}</span>
              </div>
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Ends</span>
                <span class="poly-featured-stat__value">${escapeHtml(getPolymarketEndText(featuredMarket))}</span>
              </div>
            </div>
            <div class="poly-featured-odds">
              <div class="poly-featured-odd poly-featured-odd--yes">
                <span class="poly-featured-odd__name">Yes</span>
                ${odds.yesPctMarkup}
                ${odds.yesValueMarkup}
              </div>
              <div class="poly-featured-odd poly-featured-odd--no">
                <span class="poly-featured-odd__name">No</span>
                ${odds.noPctMarkup}
                ${odds.noValueMarkup}
              </div>
            </div>
          </div>
        </article>
      `;
      applyAnimatedValues(featuredEl);
    }
  }

  if (spotlightEl) {
    if (!spotlightMarkets.length) {
      spotlightEl.innerHTML = '<div class="feature-note">More spotlight markets will appear here.</div>';
    } else {
      spotlightEl.innerHTML = spotlightMarkets.map((market) => `
        <article class="poly-spotlight-card poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <div class="poly-spotlight-card__cat">${escapeHtml(getPolymarketCategoryLabel(market))}</div>
          <div class="poly-spotlight-card__title">${escapeHtml(market.title)}</div>
          <div class="poly-spotlight-card__meta">${escapeHtml(getPolymarketStatusText(market))} | ${escapeHtml(formatCompactUsd(market.volume))}</div>
          ${buildAnimatedInlineMarkup(`poly:spotlight:${market.market_slug}:yes`, Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(1)}% YES` : '--', market.yesPct, 'div', 'poly-spotlight-card__prob')}
        </article>
      `).join('');
      applyAnimatedValues(spotlightEl);
    }
  }

  if (!listEl) return;
  if (!visibleMarkets.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No markets in this tab yet</div>
        <div class="empty-state__sub">Try another category, clear search, or wait for the next refresh.</div>
      </div>
    `;
  } else {
    const top = visibleMarkets.slice(0, Math.max(12, polymarketState.renderCount || 60));
    listEl.innerHTML = top.map((market) => {
      const leadCategory = (market.categories || []).find((category) => iconByCategory[category]) || market.category;
      const categoryIcon = iconByCategory[leadCategory] || 'Mk';
      const typeLabel = POLY_MARKET_TYPE_LABELS[market.marketType] || 'General';
      const probWidth = Number.isFinite(market.yesPct) ? Math.max(2, Math.min(98, market.yesPct)) : 50;
      const odds = buildProbabilityCells(market, `poly:grid:${market.market_slug}`);
      return `
        <article class="polymarket-card poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <div class="polymarket-card__head">
            <div class="polymarket-card__asset">${escapeHtml(categoryIcon)}</div>
            <div class="polymarket-card__title-wrap">
              <div class="polymarket-card__title">${escapeHtml(market.title)}</div>
              <div class="polymarket-card__catline">${escapeHtml(getPolymarketCategoryLabel(market))} | ${escapeHtml(typeLabel)}</div>
            </div>
            <span class="polymarket-card__status ${getPolymarketStatusClass(market)}">${getPolymarketStatusText(market)}</span>
          </div>
          <div class="polymarket-card__odds">
            <div class="poly-odd poly-odd--yes">
              <div class="poly-odd__label">Yes</div>
              ${odds.yesValueMarkup}
              ${odds.yesPctMarkup}
            </div>
            <div class="poly-odd poly-odd--no">
              <div class="poly-odd__label">No</div>
              ${odds.noValueMarkup}
              ${odds.noPctMarkup}
            </div>
          </div>
          <div class="poly-prob-row">
            <span>YES probability: ${escapeHtml(odds.yesPctText)}</span>
            <span>NO probability: ${escapeHtml(odds.noPctText)}</span>
          </div>
          <div class="poly-prob-track" aria-label="Yes probability">
            <span class="poly-prob-fill" style="width:${probWidth.toFixed(1)}%"></span>
          </div>
          <div class="polymarket-card__meta">
            <span>Volume: ${formatCompactUsd(market.volume)}</span>
            <span>Liquidity: ${formatCompactUsd(market.liquidity)}</span>
            <span>Ends: ${escapeHtml(getPolymarketEndText(market))}</span>
          </div>
        </article>
      `;
    }).join('');
    applyAnimatedValues(listEl);
  }

  document.querySelectorAll('[data-poly-open-market]').forEach((node) => {
    if (node.dataset.polyBound) return;
    node.dataset.polyBound = '1';
    if (!['BUTTON', 'A'].includes(node.tagName)) {
      node.setAttribute('tabindex', node.getAttribute('tabindex') || '0');
      node.setAttribute('role', node.getAttribute('role') || 'button');
    }
    const openMarket = () => {
      const slug = String(node.getAttribute('data-poly-open-market') || '').trim();
      if (!slug) return;
      openPolymarketDetail(slug);
    };
    node.addEventListener('click', openMarket);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMarket();
      }
    });
  });

  const shouldOpenDetail = Boolean(selectedMarket);
  const phoneDetailMode = isPhoneDetailMode();
  const desktopDetailOpen = shouldOpenDetail && !phoneDetailMode;
  const mobileDetailOpen = shouldOpenDetail && phoneDetailMode;

  if (detailBackdrop) detailBackdrop.hidden = !desktopDetailOpen;
  if (detailSheet) {
    detailSheet.hidden = !desktopDetailOpen;
    detailSheet.setAttribute('aria-hidden', desktopDetailOpen ? 'false' : 'true');
  }
  document.body.classList.toggle('poly-detail-open', desktopDetailOpen);
  document.body.classList.toggle('poly-mobile-detail-open', mobileDetailOpen);

  if (shouldOpenDetail && selectedMarket) {
    const detailMarkup = buildPolymarketDetailBodyMarkup(selectedMarket);

    if (detailTitleEl) detailTitleEl.textContent = selectedMarket.title;
    if (detailBodyEl) {
      detailBodyEl.innerHTML = detailMarkup;
      applyAnimatedValues(detailBodyEl);
    }
    if (detailPageTitleEl) detailPageTitleEl.textContent = selectedMarket.title;
    if (detailPageBodyEl) {
      detailPageBodyEl.innerHTML = detailMarkup;
      applyAnimatedValues(detailPageBodyEl);
    }

    if (phoneDetailMode) {
      if (!detailPageEl?.classList.contains('active')) {
        setActivePage('polymarket-detail', { force: true });
      }
    } else if (detailPageEl?.classList.contains('active')) {
      setActivePage('polymarket', { force: true });
    }
  } else {
    if (detailTitleEl) detailTitleEl.textContent = 'Loading market...';
    if (detailBodyEl) detailBodyEl.innerHTML = '<div class="feature-note">Choose a market card to inspect its detail.</div>';
    if (detailPageTitleEl) detailPageTitleEl.textContent = 'Loading market...';
    if (detailPageBodyEl) detailPageBodyEl.innerHTML = '<div class="feature-note">Choose a market card to inspect its detail.</div>';

    if (detailPageEl?.classList.contains('active')) {
      setActivePage('polymarket', { force: true });
      restorePolymarketListScroll();
    }
  }
  } catch (error) {
    renderPolymarketRenderFailure(error, 'dashboard');
  }
}
function renderStats(stats) {
  if (!stats) return;

  const heroEl = document.getElementById('stats-hero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="stats-hero__winrate">${stats.winRate}%</div>
      <div class="stats-hero__label">Win Rate (${stats.totalSignals} tradable signals) | Expectancy ${stats.expectancy ?? '--'}R</div>
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
        <div class="stat-tile__label">Execution</div>
        <div class="stat-tile__value">${stats.winCount ?? 0}W / ${stats.lossCount ?? 0}L</div>
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
      const ok = window.confirm('Reset live state? This keeps only the newest ACTIVE signal, deletes older signal history, clears demo trades/events/equity, and resets the account to $100,000.');
      if (!ok) return;
      resetBtn.disabled = true;
      if (status) status.textContent = 'Resetting live stats and demo state...';
      try {
        await onResetDemoAccount();
        if (status) status.textContent = 'Live state reset complete.';
        if (onRefresh) await onRefresh();
      } catch (err) {
        if (status) status.textContent = err?.message || 'Live state reset failed.';
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

function formatSignedMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  const prefix = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${prefix}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const openRows = Array.isArray(perf.effectiveOpenTrades) ? perf.effectiveOpenTrades.slice(0, 6) : [];
  const eventRows = Array.isArray(events)
    ? events.filter((evt) => String(evt.event_type || '').toUpperCase() !== 'OPEN').slice(0, 24)
    : [];
  const tradeRows = Array.isArray(trades)
    ? trades.filter((trade) => !trade.isEffectiveOpen).slice(0, 20)
    : [];
  if (openRows.length === 0 && eventRows.length === 0 && tradeRows.length === 0) {
    history.innerHTML = '<div class="feature-note">No demo trades yet.</div>';
  } else {
    const openMarkup = openRows.map((trade) => {
      const laneText = String(trade.lane || 'intraday').toUpperCase();
      const sideText = String(trade.side || '--').toUpperCase();
      const pnl = Number(trade.livePnlUsd || 0);
      const pnlCls = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'text-muted';
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${sideText} | LIVE OPEN</div>
            <div class="demo-trade-row__sub">Entry ${Number(trade.entry || 0).toFixed(2)} | Mark ${Number.isFinite(Number(trade.markPrice)) ? Number(trade.markPrice).toFixed(2) : '--'} | Size ${Number(trade.remainingPositionSize || trade.position_size || 0).toFixed(3)}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${formatSignedMoney(pnl)}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(trade.opened_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');

    const eventLabels = {
      OPEN: 'Trade opened',
      TP1_PARTIAL: 'TP1 partial fill',
      SL_TO_BREAKEVEN: 'Stop moved to breakeven',
      TP2: 'Final exit at TP2',
      TP3: 'Final exit at TP3',
      STOP_LOSS: 'Final exit at stop loss',
      BREAKEVEN: 'Final exit at breakeven',
      EXPIRED: 'Final exit expired',
    };
    const eventMarkup = eventRows.map((evt) => {
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

    const tradeMarkup = tradeRows.map((t) => {
      const side = String(t.side || '--').toUpperCase();
      const laneText = String(t.lane || 'intraday').toUpperCase();
      const statusText = String(t.effectiveStatus || t.status || '--').toUpperCase();
      const pnl = Number(t.livePnlUsd ?? t.pnl_usd ?? 0);
      const isSettling = statusText === 'SETTLING';
      const pnlCls = (statusText === 'BREAKEVEN' || isSettling) ? 'text-muted' : (pnl >= 0 ? 'profit' : 'loss');
      const pnlText = isSettling ? 'Pending' : formatMoney(pnl);
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${side} | ${statusText}</div>
            <div class="demo-trade-row__sub">${isSettling
              ? `Entry ${Number(t.entry || 0).toFixed(2)} | Awaiting reconciliation`
              : `Entry ${Number(t.entry || 0).toFixed(2)} | SL ${Number(t.sl || 0).toFixed(2)}`}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${pnlText}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(t.opened_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');

    history.innerHTML = [openMarkup, eventMarkup, tradeMarkup].filter(Boolean).join('');
  }

  if (toggle) toggle.checked = Boolean(perf.account.auto_trade_enabled);
  if (status && !status.textContent) {
    status.textContent = `Live demo P/L follows active signals and the latest XAU price.`;
  }

  renderDemoEquityCurve((Array.isArray(curve) && curve.length > 0) ? curve : perf.equityPoints || []);
}

function updateRiskCalc(signal, riskState = null) {
  const lotInput = document.getElementById('lot-input');
  if (!lotInput) return;
  const equityInput = document.getElementById('equity-input');
  const pipChangeInput = document.getElementById('pip-change-input');
  const plPreviewEl = document.getElementById('pl-preview-value');
  const advisedLotEl = document.getElementById('advised-lot-value');
  const riskGuardEl = document.getElementById('risk-guard-note');
  const dollarsPerPipPerLot = XAU_PIP_SIZE * 100;

  const setValues = () => {
    const lotSize = Math.max(parseFloat(lotInput?.value || '0') || 0, 0);
    const equity = Math.max(parseFloat(equityInput?.value || '10000') || 0, 0);
    const pipChange = parseFloat(pipChangeInput?.value || '0') || 0;
    const plPreview = pipChange * lotSize * dollarsPerPipPerLot;

    if (plPreviewEl) {
      plPreviewEl.textContent = formatSignedMoney(plPreview);
      plPreviewEl.className = `risk-val__num ${plPreview > 0 ? 'profit' : plPreview < 0 ? 'loss' : 'text-muted'}`;
    }

    const signalData = lotInput._riskSignal;
    if (!signalData) {
      if (advisedLotEl) {
        advisedLotEl.textContent = '--';
        advisedLotEl.className = 'risk-val__num text-muted';
      }
      if (riskGuardEl) {
        riskGuardEl.textContent = 'Advice appears when a tradable signal is live.';
      }
      return;
    }

    const lane = String(signalData.lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
    const riskPct = lane === 'swing' ? 0.75 : 0.50;
    const entry = parseFloat(signalData.entry_price) || 0;
    const sl = parseFloat(signalData.stop_loss ?? signalData.sl) || 0;
    const stopDist = Math.abs(entry - sl);
    const riskDollars = equity * (riskPct / 100);
    const stopPips = stopDist > 0 ? (stopDist / XAU_PIP_SIZE) : 0;
    const advisedLot = stopPips > 0 ? (riskDollars / (stopPips * dollarsPerPipPerLot)) : NaN;

    if (advisedLotEl) {
      advisedLotEl.textContent = Number.isFinite(advisedLot) ? advisedLot.toFixed(2) : '--';
      advisedLotEl.className = `risk-val__num ${Number.isFinite(advisedLot) ? 'profit' : 'text-muted'}`;
    }

    if (riskGuardEl) {
      riskGuardEl.textContent = Number.isFinite(advisedLot)
        ? `Advice uses ${lane === 'swing' ? 'Swing 0.75%' : 'Intraday 0.50%'} risk over a ${stopPips.toFixed(1)}p stop on the live signal.`
        : 'Advice appears when a tradable signal is live.';
    }
  };

  if (!lotInput._riskBound) {
    lotInput.addEventListener('input', setValues);
    if (equityInput) equityInput.addEventListener('input', setValues);
    if (pipChangeInput) pipChangeInput.addEventListener('input', setValues);
    lotInput._riskBound = true;
  }

  lotInput._riskSignal = signal || null;
  setValues();
}

window.UI = {
  initTheme,
  initTranslateToggle,
  initNavigation,
  initDashboardSwitch,
  initPolymarketControls,
  getSelectedPolymarketMarketSlug,
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
  renderNewsBanner,
  renderHistory,
  renderEvents,
  renderPolymarketDashboard,
  renderPolymarketRenderFailure,
  renderStats,
  initDemoControls,
  renderDemoDashboard,
  renderDemoEquityCurve,
  setPolymarketMarketHistory,
  updateRiskCalc,
};



