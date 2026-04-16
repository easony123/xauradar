/**
 * chart.js — TradingView Lightweight Charts integration.
 * Lazy-initialized when the Chart tab is opened.
 */

let chart = null;
let candleSeries = null;
let chartInitialized = false;
let tp1Line = null;
let tp2Line = null;
let tp3Line = null;
let slLine = null;
let entryLine = null;

function isInitialized() {
  return chartInitialized;
}

function init() {
  const container = document.getElementById('chart-canvas');
  if (!container || chartInitialized) return;

  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight || 400,
    layout: {
      background: { color: '#161b22' },
      textColor: '#8b949e',
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: 'rgba(240,246,252,0.04)' },
      horzLines: { color: 'rgba(240,246,252,0.04)' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(247,147,26,0.3)', labelBackgroundColor: '#F7931A' },
      horzLine: { color: 'rgba(247,147,26,0.3)', labelBackgroundColor: '#F7931A' },
    },
    rightPriceScale: {
      borderColor: 'rgba(240,246,252,0.06)',
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    timeScale: {
      borderColor: 'rgba(240,246,252,0.06)',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: { vertTouchDrag: false },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#3fb950',
    downColor: '#f85149',
    borderUpColor: '#3fb950',
    borderDownColor: '#f85149',
    wickUpColor: '#3fb950',
    wickDownColor: '#f85149',
  });

  chartInitialized = true;

  // Load candles
  loadCandles();

  // Resize handler
  const ro = new ResizeObserver(() => {
    if (chart) chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
  });
  ro.observe(container);

  // Timeframe buttons
  document.querySelectorAll('.tf-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tf = parseInt(btn.dataset.tf);
      loadCandles(100, tf);
      const title = document.querySelector('.chart-toolbar__title');
      if (title) {
        const labels = { 15: 'M15', 60: 'H1', 240: 'H4' };
        title.textContent = `XAUUSD · ${labels[tf] || 'M15'}`;
      }
    });
  });

  // Periodic candle refresh
  setInterval(() => loadCandles(), 60000);
}

async function loadCandles(bars = 100, minutes = 15) {
  if (!candleSeries) return;

  try {
    const now = Date.now();
    const from = now - bars * minutes * 60 * 1000 - 60 * 60 * 1000 * 24; // go back an extra day just in case of delays
    const url = `https://api.polygon.io/v2/aggs/ticker/C:XAUUSD/range/${minutes}/minute/${from}/${now}?adjusted=true&sort=asc&limit=${bars}&apiKey=34FMvo_3DD6hL54apDwMKPXNk_aa86uv`;

    const resp = await fetch(url);
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.results || data.results.length === 0) return;

    const candles = data.results.map((r) => ({
      time: Math.floor(r.t / 1000),
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
    }));

    candleSeries.setData(candles);
    chart.timeScale().fitContent();
  } catch (err) {
    console.error('Chart candle error:', err.message);
  }
}

function drawSignalOverlay(signal) {
  if (!candleSeries || !signal) return;

  // Remove old lines
  [tp1Line, tp2Line, tp3Line, slLine, entryLine].forEach((l) => {
    if (l) candleSeries.removePriceLine(l);
  });

  const entry = parseFloat(signal.entry_price) || 0;
  const tp1 = parseFloat(signal.tp1) || 0;
  const tp2 = parseFloat(signal.tp2) || 0;
  const tp3 = parseFloat(signal.tp3) || 0;
  const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;

  const lineOpts = (price, color, title) => ({
    price,
    color,
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title,
  });

  if (entry) entryLine = candleSeries.createPriceLine(lineOpts(entry, '#58a6ff', 'Entry'));
  if (tp1) tp1Line = candleSeries.createPriceLine(lineOpts(tp1, '#3fb950', 'TP1'));
  if (tp2) tp2Line = candleSeries.createPriceLine(lineOpts(tp2, '#238636', 'TP2'));
  if (tp3) tp3Line = candleSeries.createPriceLine(lineOpts(tp3, '#196c2e', 'TP3'));
  if (sl) slLine = candleSeries.createPriceLine(lineOpts(sl, '#f85149', 'SL'));
}

// ── Exports ──────────────────────────────────────────────────
window.Chart = {
  init,
  isInitialized,
  loadCandles,
  drawSignalOverlay,
};
