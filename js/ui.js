/**
 * ui.js — DOM rendering for the MooMoo-style multi-page dashboard.
 * Handles page switching, signal rendering, indicators, history, stats, etc.
 */

// ── Page Navigation ──────────────────────────────────────────

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.page;

      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');

      pages.forEach((p) => p.classList.remove('active'));
      const page = document.getElementById(`page-${target}`);
      if (page) page.classList.add('active');

      // Lazy init chart when switching to chart tab
      if (target === 'chart' && window.Chart && !window.Chart.isInitialized()) {
        window.Chart.init();
      }
    });
  });
}

// ── Session Clock ────────────────────────────────────────────

function updateSessionPill() {
  const el = document.getElementById('session-pill');
  if (!el) return;

  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const total = utcH * 60 + utcM;

  // Sessions in UTC
  const sessions = [
    { name: 'Sydney', start: 21 * 60, end: 30 * 60, color: '#58a6ff' },     // 21:00-06:00
    { name: 'Tokyo', start: 0, end: 9 * 60, color: '#bc8cff' },             // 00:00-09:00
    { name: 'London', start: 7 * 60, end: 16 * 60, color: '#3fb950' },      // 07:00-16:00
    { name: 'New York', start: 12 * 60, end: 21 * 60, color: '#f85149' },   // 12:00-21:00
  ];

  let active = null;
  for (const s of sessions) {
    const normStart = s.start % (24 * 60);
    const normEnd = s.end % (24 * 60);
    if (normStart < normEnd) {
      if (total >= normStart && total < normEnd) { active = s; break; }
    } else {
      if (total >= normStart || total < normEnd) { active = s; break; }
    }
  }

  if (active) {
    const endM = active.end % (24 * 60);
    let left = endM - total;
    if (left < 0) left += 24 * 60;
    const h = Math.floor(left / 60);
    const m = left % 60;
    el.textContent = `🟢 ${active.name} · ${h}h ${m}m left`;
    el.style.background = `${active.color}22`;
    el.style.color = active.color;
  } else {
    el.textContent = '⏳ Market Closed';
    el.style.background = '';
    el.style.color = '';
  }
}

// ── Header Price ─────────────────────────────────────────────

function updateHeaderPrice(priceData) {
  if (!priceData || !priceData.price) return;

  const priceEl = document.getElementById('header-price');
  const changeEl = document.getElementById('header-change');
  const statusEl = document.getElementById('connection-status');

  if (priceEl) {
    priceEl.textContent = `$${priceData.price.toFixed(2)}`;
    priceEl.className = 'topbar__price';
    if (priceData.direction) priceEl.classList.add(priceData.direction);
    priceEl.classList.add('price-bounce');
    setTimeout(() => priceEl.classList.remove('price-bounce'), 300);
  }

  if (changeEl && priceData.spread !== undefined) {
    changeEl.textContent = `Spread: ${priceData.spread.toFixed(2)}`;
    changeEl.className = 'topbar__change';
  }

  if (statusEl) {
    statusEl.innerHTML = '<span class="status-dot"></span>';
  }
}

// ── Signal Hero ──────────────────────────────────────────────

function renderSignalHero(signal) {
  const hero = document.getElementById('signal-hero');
  if (!hero) return;

  if (!signal) {
    hero.innerHTML = `
      <div class="signal-hero__badge waiting">📡 Waiting for signal setup...</div>
      <div class="signal-hero__time">Bot checks every 5 minutes</div>
    `;
    return;
  }

  const type = signal.signal_type || signal.type || 'WAIT';
  const conf = signal.confidence || 0;
  const confClass = conf >= 70 ? 'conf-high' : conf >= 50 ? 'conf-med' : 'conf-low';
  const time = signal.created_at ? new Date(signal.created_at).toLocaleString() : '';
  const regime = signal.h1_regime || ((signal.adx_value || 0) >= 20 ? 'Trending' : 'Range');

  hero.innerHTML = `
    <div class="signal-hero__badge ${type.toLowerCase()}">${type === 'BUY' ? '🟢' : '🔴'} ${type}</div>
    <div class="signal-hero__conf">Confidence: <strong class="${confClass}">${conf}%</strong> · Regime: ${regime}</div>
    <div class="signal-hero__time">${time}</div>
  `;
}

// ── Levels ───────────────────────────────────────────────────

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
    const pips = Math.abs(target - price).toFixed(1);
    return `${pips}p`;
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

// ── Conditions ───────────────────────────────────────────────

function renderConditions(signal, snapshot) {
  const container = document.getElementById('conditions-row');
  if (!container) return;

  const signalConditions = signal && signal.conditions_met && typeof signal.conditions_met === 'object'
    ? signal.conditions_met
    : null;

  if (signalConditions) {
    const orderedConditions = [
      { key: 'stochrsi', label: 'stochrsi' },
      { key: 'macd', label: 'macd' },
      { key: 'keltner', label: 'keltner' },
      { key: 'asian_range', label: 'asian range' },
    ];

    container.innerHTML = orderedConditions.map((condition) => {
      const met = Boolean(signalConditions[condition.key]);
      return `<span class="cond-chip ${met ? 'met' : 'missed'}">${met ? '✓' : '✗'} ${condition.label}</span>`;
    }).join('');
    return;
  }

  if (!snapshot) {
    container.innerHTML = `
      <span class="cond-chip missed">— stochrsi</span>
      <span class="cond-chip missed">— macd</span>
      <span class="cond-chip missed">— keltner</span>
      <span class="cond-chip missed">— asian range</span>
    `;
    return;
  }

  const conds = [
    { name: 'stochrsi', met: snapshot.stochrsi_k < 20 || snapshot.stochrsi_k > 80 },
    { name: 'macd', met: (snapshot.macd_value || 0) !== 0 },
    { name: 'keltner', met: (snapshot.keltner_upper || 0) > 0 && (snapshot.keltner_lower || 0) > 0 },
    { name: 'asian range', met: false },
  ];

  container.innerHTML = conds.map((c) =>
    `<span class="cond-chip ${c.met ? 'met' : 'missed'}">${c.met ? '✓' : '✗'} ${c.name}</span>`
  ).join('');
}

// ── Indicators ───────────────────────────────────────────────

function renderIndicators(snapshot) {
  const grid = document.getElementById('indicators-grid');
  if (!grid) return;

  if (!snapshot) return;

  const items = [
    {
      name: 'ADX',
      val: (snapshot.adx_value || 0).toFixed(1),
      tag: (snapshot.adx_value || 0) >= 25 ? 'Strong' : (snapshot.adx_value || 0) >= 20 ? 'Weak' : 'Range',
      cls: (snapshot.adx_value || 0) >= 20 ? 'bullish' : 'neutral',
    },
    {
      name: 'StochRSI',
      val: (snapshot.stochrsi_k || 0).toFixed(1),
      tag: (snapshot.stochrsi_k || 0) > 80 ? 'Overbought' : (snapshot.stochrsi_k || 0) < 20 ? 'Oversold' : 'Neutral',
      cls: (snapshot.stochrsi_k || 0) < 20 ? 'bullish' : (snapshot.stochrsi_k || 0) > 80 ? 'bearish' : 'neutral',
    },
    {
      name: 'MACD',
      val: (snapshot.macd_value || 0).toFixed(2),
      tag: (snapshot.macd_value || 0) > 0 ? 'Bullish' : 'Bearish',
      cls: (snapshot.macd_value || 0) > 0 ? 'bullish' : 'bearish',
    },
    {
      name: 'ATR',
      val: (snapshot.atr_value || 0).toFixed(2),
      tag: (snapshot.atr_value || 0) > 15 ? 'High Vol' : 'Normal',
      cls: (snapshot.atr_value || 0) > 15 ? 'bearish' : 'neutral',
    },
  ];

  grid.innerHTML = items.map((i) => `
    <div class="indi-card">
      <div class="indi-card__name">${i.name}</div>
      <div class="indi-card__val">${i.val}</div>
      <div class="indi-card__tag ${i.cls}">${i.tag}</div>
    </div>
  `).join('');
}

// ── DXY Widget ───────────────────────────────────────────────

function renderDXY(dxyData) {
  const widget = document.getElementById('dxy-widget');
  if (!widget || !dxyData) return;

  const priceEl = widget.querySelector('.dxy-row__price');
  const corrEl = widget.querySelector('.dxy-row__corr');
  if (priceEl) priceEl.textContent = dxyData.price ? dxyData.price.toFixed(2) : '—';

  if (corrEl && dxyData.direction) {
    const xauDir = window._lastPriceDirection;
    // Gold and DXY are typically inversely correlated
    if (dxyData.direction === 'DOWN' && xauDir === 'up') {
      corrEl.textContent = '🟢 Confirms LONG';
      corrEl.className = 'dxy-row__corr confirms';
    } else if (dxyData.direction === 'UP' && xauDir === 'down') {
      corrEl.textContent = '🟢 Confirms SHORT';
      corrEl.className = 'dxy-row__corr confirms';
    } else if (dxyData.direction === 'UP' && xauDir === 'up') {
      corrEl.textContent = '⚠️ Diverging';
      corrEl.className = 'dxy-row__corr diverges';
    } else {
      corrEl.textContent = '⚠️ Diverging';
      corrEl.className = 'dxy-row__corr diverges';
    }
  }
}

// ── News Banner ──────────────────────────────────────────────

function renderNewsBanner(events) {
  const banner = document.getElementById('news-banner');
  if (!banner) return;

  if (!events || events.length === 0) {
    banner.classList.remove('visible');
    return;
  }

  const next = events[0];
  const time = new Date(next.event_date);
  const diff = time - Date.now();
  const mins = Math.floor(diff / 60000);

  if (mins > 0 && mins <= 120) {
    banner.classList.add('visible');
    banner.querySelector('.news-banner__text').textContent = `${next.event_name} (${next.impact})`;
    banner.querySelector('.news-banner__time').textContent = mins <= 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
  } else {
    banner.classList.remove('visible');
  }
}

// ── History List ─────────────────────────────────────────────

function renderHistory(signals) {
  const container = document.getElementById('history-list');
  if (!container) return;

  if (!signals || signals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📜</div>
        <div class="empty-state__title">No signals yet</div>
        <div class="empty-state__sub">Signals will appear here as they're generated</div>
      </div>
    `;
    return;
  }

  container.innerHTML = signals.map((s) => {
    const type = s.signal_type || s.type || 'WAIT';
    const entry = parseFloat(s.entry_price) || 0;
    const conf = s.confidence || 0;
    const time = s.created_at ? new Date(s.created_at).toLocaleString() : '';
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

// ── Events List ──────────────────────────────────────────────

function renderEvents(events) {
  const container = document.getElementById('events-list');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px">
        <div class="empty-state__sub">No upcoming high-impact events</div>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map((e) => {
    const time = new Date(e.event_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${e.event_name}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">${time}</div>
        </div>
        <span style="font-size:11px;font-weight:600;color:var(--red);background:var(--red-dim);padding:2px 8px;border-radius:100px">${e.impact}</span>
      </div>
    `;
  }).join('');
}

// ── Stats ────────────────────────────────────────────────────

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

// ── Risk Calculator ──────────────────────────────────────────

function updateRiskCalc(signal) {
  if (!signal) return;

  const lotInput = document.getElementById('lot-input');
  if (!lotInput) return;

  const update = () => {
    const lots = parseFloat(lotInput.value) || 0.01;
    const entry = parseFloat(signal.entry_price) || 0;
    const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;
    const tp1 = parseFloat(signal.tp1) || 0;
    const tp2 = parseFloat(signal.tp2) || 0;
    const tp3 = parseFloat(signal.tp3) || 0;

    // XAU: $1 per pip per 0.01 lot (standard lot = 100oz)
    const mult = lots * 100;

    const body = document.getElementById('risk-calc-body');
    if (!body) return;

    const vals = body.querySelectorAll('.risk-val__num');
    if (vals.length >= 4) {
      vals[0].textContent = `-$${(Math.abs(entry - sl) * mult).toFixed(2)}`;
      vals[0].className = 'risk-val__num loss';
      vals[1].textContent = `+$${(Math.abs(tp1 - entry) * mult).toFixed(2)}`;
      vals[1].className = 'risk-val__num profit';
      vals[2].textContent = `+$${(Math.abs(tp2 - entry) * mult).toFixed(2)}`;
      vals[2].className = 'risk-val__num profit';
      vals[3].textContent = `+$${(Math.abs(tp3 - entry) * mult).toFixed(2)}`;
      vals[3].className = 'risk-val__num profit';
    }
  };

  lotInput.removeEventListener('input', update);
  lotInput.addEventListener('input', update);
  update();
}

// ── Exports ──────────────────────────────────────────────────
window.UI = {
  initNavigation,
  updateSessionPill,
  updateHeaderPrice,
  renderSignalHero,
  renderLevels,
  renderConditions,
  renderIndicators,
  renderDXY,
  renderNewsBanner,
  renderHistory,
  renderEvents,
  renderStats,
  updateRiskCalc,
};
