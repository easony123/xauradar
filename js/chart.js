/**
 * chart.js - TradingView Lightweight Charts integration.
 */

let chart = null;
let candleSeries = null;
let chartInitialized = false;
let tp1Line = null;
let tp2Line = null;
let tp3Line = null;
let slLine = null;
let entryLine = null;
let currentTimeframe = 15;
const CHART_TZ = 'Asia/Kuala_Lumpur';

function formatChartTime(valueMs) {
  const date = new Date(valueMs);
  if (Number.isNaN(date.getTime())) return '--';
  const fmt = new Intl.DateTimeFormat('en-MY', {
    timeZone: CHART_TZ,
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fmt.format(date)} MYT`;
}

function getChartTheme(theme) {
  if (theme === 'light') {
    return {
      background: '#f8f9fe',
      text: '#5d6886',
      grid: 'rgba(77, 94, 132, 0.1)',
      border: 'rgba(88, 104, 140, 0.2)',
      cross: 'rgba(105, 63, 255, 0.3)',
      crossLabel: '#6b2dff',
    };
  }

  return {
    background: '#161b22',
    text: '#8b949e',
    grid: 'rgba(240,246,252,0.04)',
    border: 'rgba(240,246,252,0.06)',
    cross: 'rgba(247,147,26,0.3)',
    crossLabel: '#F7931A',
  };
}

function applyTheme(theme) {
  if (!chart) return;
  const t = getChartTheme(theme);
  chart.applyOptions({
    layout: {
      background: { color: t.background },
      textColor: t.text,
      fontFamily: "'Manrope', sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: t.grid },
      horzLines: { color: t.grid },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: t.cross, labelBackgroundColor: t.crossLabel },
      horzLine: { color: t.cross, labelBackgroundColor: t.crossLabel },
    },
    rightPriceScale: {
      borderColor: t.border,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    timeScale: {
      borderColor: t.border,
      timeVisible: true,
      secondsVisible: false,
    },
  });
}

function isInitialized() {
  return chartInitialized;
}

function init() {
  const container = document.getElementById('chart-canvas');
  if (!container || chartInitialized) return;

  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight || 400,
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

  applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');

  chartInitialized = true;
  loadCandles();

  const ro = new ResizeObserver(() => {
    if (chart) chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
  });
  ro.observe(container);

  document.querySelectorAll('.tf-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tf = parseInt(btn.dataset.tf, 10);
      currentTimeframe = tf;
      loadCandles(100, tf);
      const title = document.querySelector('.chart-toolbar__title');
      if (title) {
        const labels = { 5: 'M5', 15: 'M15', 60: 'H1', 240: 'H4' };
        title.textContent = `XAUUSD | ${labels[tf] || 'M15'}`;
      }
    });
  });

  setInterval(() => loadCandles(100, currentTimeframe), 60000);
}

async function loadCandles(bars = 100, minutes = 15) {
  if (!candleSeries) return;

  try {
    if (!window.API || !window.API.fetchChartCandles) return;
    const candles = await window.API.fetchChartCandles(bars, minutes);
    if (!candles || candles.length === 0) return;

    candleSeries.setData(candles);
    chart.timeScale().fitContent();
    const last = candles[candles.length - 1];
    const lastCandleEl = document.getElementById('chart-last-candle');
    if (lastCandleEl && last?.time) {
      lastCandleEl.textContent = `Last candle: ${formatChartTime(last.time * 1000)}`;
    }
    if (window.__currentSignal) {
      drawSignalOverlay(window.__currentSignal);
    }
  } catch (err) {
    console.error('Chart candle error:', err.message);
  }
}

function drawSignalOverlay(signal) {
  if (!candleSeries || !signal) return;

  [tp1Line, tp2Line, tp3Line, slLine, entryLine].forEach((line) => {
    if (line) candleSeries.removePriceLine(line);
  });

  const entry = parseFloat(signal.entry_price) || 0;
  const tp1 = parseFloat(signal.tp1) || 0;
  const tp2 = parseFloat(signal.tp2) || 0;
  const tp3 = parseFloat(signal.tp3) || 0;
  const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;

  const makeLine = (price, color, title) => ({
    price,
    color,
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title,
  });

  if (entry) entryLine = candleSeries.createPriceLine(makeLine(entry, '#4f8cff', 'Entry'));
  if (tp1) tp1Line = candleSeries.createPriceLine(makeLine(tp1, '#3fb950', 'TP1'));
  if (tp2) tp2Line = candleSeries.createPriceLine(makeLine(tp2, '#22a75f', 'TP2'));
  if (tp3) tp3Line = candleSeries.createPriceLine(makeLine(tp3, '#1c914f', 'TP3'));
  if (sl) slLine = candleSeries.createPriceLine(makeLine(sl, '#f85149', 'SL'));
}

window.Chart = {
  init,
  isInitialized,
  loadCandles,
  drawSignalOverlay,
  applyTheme,
};
