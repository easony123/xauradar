"""
XAUUSD Trading Signal Generator
================================
Runs every 5 minutes via GitHub Actions.
Fetches M15/H1 candles from Twelve Data, computes indicators,
generates BUY/SELL signals, and writes to Supabase.
"""

import json
import math
import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import Client, create_client
from ta.momentum import StochRSIIndicator
from ta.trend import ADXIndicator, MACD
from ta.volatility import AverageTrueRange, KeltnerChannel

load_dotenv()

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()
TWELVE_BASE_URL = "https://api.twelvedata.com"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Session / strategy config
ASIAN_SESSION_START_HOUR = 0
ASIAN_SESSION_END_HOUR = 8

NEWS_BLACKOUT_MINUTES = 15
TREND_ADX_MIN = 22
RANGE_ADX_MAX = 18
HIGH_VOL_MULTIPLIER = 1.3
ACTIVE_ATR_MULTIPLIER_MIN = 0.8
BREAKOUT_BUFFER_ATR = 0.15
BUY_PROB_THRESHOLD = 0.58
SELL_PROB_THRESHOLD = 0.42
MIN_CONFIRMATIONS = 3
STOP_MULTIPLIER = 1.5
TP1_MULTIPLIER = 1.0
TP2_MULTIPLIER = 2.0
TP3_MULTIPLIER = 3.0
MAX_CONSECUTIVE_SL = 3
SL_COOLDOWN_MINUTES = 30


def fetch_candles(symbol: str, multiplier: int, timespan: str, bars: int = 100) -> pd.DataFrame | None:
    """Fetch OHLCV candles from Twelve Data /time_series endpoint."""
    if not TWELVE_DATA_API_KEY:
        print("  ERROR: Missing TWELVE_DATA_API_KEY")
        return None

    interval = f"{multiplier}min" if timespan == "minute" else f"{multiplier}h"

    try:
        resp = requests.get(
            f"{TWELVE_BASE_URL}/time_series",
            params={
                "symbol": symbol,
                "interval": interval,
                "outputsize": bars,
                "order": "ASC",
                "timezone": "UTC",
                "apikey": TWELVE_DATA_API_KEY,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        if str(data.get("status", "")).lower() == "error":
            print(f"  ERROR: Twelve Data returned error for {symbol} {interval}: {data.get('message', 'unknown')}")
            return None

        values = data.get("values", [])
        if not values:
            print(f"  WARNING: No candles for {symbol} {interval}")
            return None

        df = pd.DataFrame(values)
        required = ("open", "high", "low", "close", "datetime")
        if not all(col in df.columns for col in required):
            print(f"  ERROR: Unexpected candle payload for {symbol} {interval}")
            return None

        df = df.rename(
            columns={
                "open": "Open",
                "high": "High",
                "low": "Low",
                "close": "Close",
                "volume": "Volume",
                "datetime": "Timestamp",
            }
        )
        if "Volume" not in df.columns:
            df["Volume"] = 0

        df["Timestamp"] = pd.to_datetime(df["Timestamp"], utc=True, errors="coerce")
        df = df.dropna(subset=["Timestamp"])
        df = df.set_index("Timestamp")
        df = df[["Open", "High", "Low", "Close", "Volume"]].astype(float)
        df = df.sort_index()
        return df.tail(bars)
    except Exception as e:
        print(f"  ERROR fetching candles for {symbol} {interval}: {e}")
        return None


def fetch_dxy_quote() -> dict | None:
    """Optional DXY proxy fetch from Twelve Data. Returns None when unavailable."""
    if not TWELVE_DATA_API_KEY:
        return None

    try:
        resp = requests.get(
            f"{TWELVE_BASE_URL}/price",
            params={"symbol": "DXY", "apikey": TWELVE_DATA_API_KEY},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        if str(data.get("status", "")).lower() == "error":
            return None

        price = data.get("price")
        if price is None:
            return None
        return {"price": float(price)}
    except Exception:
        # DXY is optional; neutral confluence is fine.
        return None


def calculate_m15_indicators(df: pd.DataFrame) -> pd.DataFrame:
    close = df["Close"]
    high = df["High"]
    low = df["Low"]

    stoch = StochRSIIndicator(close=close, window=14, smooth1=3, smooth2=3)
    # Keep legacy 0-100 scale expected by thresholds/UI.
    df["stochrsi_k"] = stoch.stochrsi_k() * 100.0
    df["stochrsi_d"] = stoch.stochrsi_d() * 100.0

    macd = MACD(close=close, window_fast=12, window_slow=26, window_sign=9)
    df["macd_line"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()
    df["macd_histogram"] = macd.macd_diff()

    kc = KeltnerChannel(high=high, low=low, close=close, window=20, window_atr=10, original_version=False)
    df["keltner_lower"] = kc.keltner_channel_lband()
    df["keltner_mid"] = kc.keltner_channel_mband()
    df["keltner_upper"] = kc.keltner_channel_hband()

    atr = AverageTrueRange(high=high, low=low, close=close, window=14)
    df["atr"] = atr.average_true_range()
    return df


def calculate_h1_indicators(df: pd.DataFrame) -> pd.DataFrame:
    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"].fillna(0)

    adx = ADXIndicator(high=high, low=low, close=close, window=14)
    df["adx"] = adx.adx()
    df["dmp"] = adx.adx_pos()
    df["dmn"] = adx.adx_neg()

    typical_price = (high + low + close) / 3.0
    cum_vol = volume.cumsum()
    cum_tpv = (typical_price * volume).cumsum()
    df["vwap"] = cum_tpv / cum_vol.replace(0, pd.NA)

    df["sma50"] = close.rolling(window=50, min_periods=1).mean()
    return df


def get_asian_session_range(df_m15: pd.DataFrame) -> dict | None:
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    asian_start = today.replace(hour=ASIAN_SESSION_START_HOUR)
    asian_end = today.replace(hour=ASIAN_SESSION_END_HOUR)

    asian_bars = df_m15[(df_m15.index >= asian_start) & (df_m15.index < asian_end)]
    if len(asian_bars) < 2:
        return None

    return {
        "high": float(asian_bars["High"].max()),
        "low": float(asian_bars["Low"].min()),
    }


def check_news_blackout() -> bool:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=NEWS_BLACKOUT_MINUTES)
    window_end = now + timedelta(minutes=NEWS_BLACKOUT_MINUTES)

    try:
        resp = (
            supabase.table("economic_events")
            .select("*")
            .eq("currency", "USD")
            .eq("impact", "HIGH")
            .gte("event_date", window_start.isoformat())
            .lte("event_date", window_end.isoformat())
            .execute()
        )
        if resp.data and len(resp.data) > 0:
            event = resp.data[0]
            print(f"  WARNING: News blackout: {event['event_name']} within +/-{NEWS_BLACKOUT_MINUTES}m window")
            return True
    except Exception as e:
        print(f"  WARNING: Could not check news: {e}")

    return False


def parse_signal_time(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def get_risk_guard_state() -> dict:
    try:
        resp = (
            supabase.table("signals")
            .select("status,created_at")
            .neq("status", "ACTIVE")
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        closed = resp.data or []
    except Exception as e:
        print(f"  WARNING: Could not read signal history for risk guard: {e}")
        return {
            "allow_entry": True,
            "reason": "history_unavailable",
            "cooldown_minutes_left": 0,
            "consecutive_sl": 0,
        }

    consecutive_sl = 0
    for row in closed:
        if row.get("status") == "HIT_SL":
            consecutive_sl += 1
        else:
            break

    latest_sl_time = None
    for row in closed:
        if row.get("status") == "HIT_SL":
            latest_sl_time = parse_signal_time(row.get("created_at"))
            break

    cooldown_left = 0
    if latest_sl_time is not None:
        elapsed = datetime.now(timezone.utc) - latest_sl_time
        cooldown_left = max(0, SL_COOLDOWN_MINUTES - int(elapsed.total_seconds() // 60))

    allow_entry = True
    reason = "ok"
    if cooldown_left > 0:
        allow_entry = False
        reason = f"sl_cooldown_{cooldown_left}m"
    elif consecutive_sl >= MAX_CONSECUTIVE_SL:
        allow_entry = False
        reason = f"max_consecutive_sl_{consecutive_sl}"

    return {
        "allow_entry": allow_entry,
        "reason": reason,
        "cooldown_minutes_left": cooldown_left,
        "consecutive_sl": consecutive_sl,
    }


def classify_regime(df_m15: pd.DataFrame, df_h1: pd.DataFrame, asian_range: dict | None) -> dict:
    latest_m15 = df_m15.iloc[-1]
    latest_h1 = df_h1.iloc[-1]

    adx = float(latest_h1.get("adx", 0) or 0)
    atr_m15 = float(latest_m15.get("atr", 0) or 0)
    close = float(latest_m15["Close"])

    atr_series = df_m15["atr"].dropna() if "atr" in df_m15.columns else pd.Series(dtype=float)
    atr_median = float(atr_series.tail(80).median()) if len(atr_series) > 10 else (atr_m15 or 1.0)
    if atr_median <= 0:
        atr_median = max(atr_m15, 1.0)

    atr_ratio = atr_m15 / atr_median if atr_median > 0 else 1.0
    high_vol = atr_ratio >= HIGH_VOL_MULTIPLIER

    breakout_up = False
    breakout_down = False
    if asian_range is not None and atr_m15 > 0:
        breakout_up = close > (asian_range["high"] + (atr_m15 * BREAKOUT_BUFFER_ATR))
        breakout_down = close < (asian_range["low"] - (atr_m15 * BREAKOUT_BUFFER_ATR))

    if high_vol and (breakout_up or breakout_down):
        name = "HIGH_VOL_BREAKOUT"
        reason = "High ATR regime with Asian-range expansion"
    elif adx >= TREND_ADX_MIN and atr_ratio >= ACTIVE_ATR_MULTIPLIER_MIN:
        name = "TREND"
        reason = "ADX and ATR support trend continuation"
    elif adx <= RANGE_ADX_MAX:
        name = "RANGE"
        reason = "Low ADX suggests mean-reversion conditions"
    else:
        name = "NEUTRAL"
        reason = "Mixed regime; directional edge is weaker"

    return {
        "name": name,
        "reason": reason,
        "adx": adx,
        "atr": atr_m15,
        "atr_ratio": atr_ratio,
        "breakout_up": breakout_up,
        "breakout_down": breakout_down,
    }


def get_structural_bias(df_h1: pd.DataFrame) -> str:
    latest = df_h1.iloc[-1]
    vwap = latest.get("vwap", None)
    close = latest["Close"]

    if vwap is None or pd.isna(vwap):
        sma = latest.get("sma50", None)
        if sma is not None and not pd.isna(sma):
            return "BUY_ONLY" if close > sma else "SELL_ONLY"
        return "BUY_ONLY"

    return "BUY_ONLY" if close > vwap else "SELL_ONLY"


def build_direction_conditions(df_m15: pd.DataFrame, direction: str, asian_range: dict | None, regime_name: str) -> dict:
    latest = df_m15.iloc[-1]
    prev = df_m15.iloc[-2]

    k_now = float(latest.get("stochrsi_k", 50) or 50)
    d_now = float(latest.get("stochrsi_d", 50) or 50)
    k_prev = float(prev.get("stochrsi_k", 50) or 50)
    d_prev = float(prev.get("stochrsi_d", 50) or 50)

    hist_now = float(latest.get("macd_histogram", 0) or 0)
    hist_prev = float(prev.get("macd_histogram", 0) or 0)

    close = float(latest["Close"])
    atr = float(latest.get("atr", 0) or 0)
    kc_upper = latest.get("keltner_upper", None)
    kc_lower = latest.get("keltner_lower", None)
    kc_mid = latest.get("keltner_mid", None)

    if direction == "BUY":
        stochrsi = (k_prev < d_prev and k_now > d_now and k_now < 35)
        macd = (hist_now > hist_prev and hist_now > 0)
        keltner = (kc_upper is not None and not pd.isna(kc_upper) and close > float(kc_upper))
        pullback = (kc_mid is not None and not pd.isna(kc_mid) and close >= float(kc_mid))
        asian_breakout = (asian_range is not None and atr > 0 and close > (asian_range["high"] + (atr * BREAKOUT_BUFFER_ATR)))
        mean_reversion = (regime_name == "RANGE" and kc_lower is not None and not pd.isna(kc_lower) and k_now < 15 and close <= float(kc_lower))
    else:
        stochrsi = (k_prev > d_prev and k_now < d_now and k_now > 65)
        macd = (hist_now < hist_prev and hist_now < 0)
        keltner = (kc_lower is not None and not pd.isna(kc_lower) and close < float(kc_lower))
        pullback = (kc_mid is not None and not pd.isna(kc_mid) and close <= float(kc_mid))
        asian_breakout = (asian_range is not None and atr > 0 and close < (asian_range["low"] - (atr * BREAKOUT_BUFFER_ATR)))
        mean_reversion = (regime_name == "RANGE" and kc_upper is not None and not pd.isna(kc_upper) and k_now > 85 and close >= float(kc_upper))

    return {
        "stochrsi": bool(stochrsi),
        "macd": bool(macd),
        "keltner": bool(keltner),
        "asian_range": bool(asian_breakout),
        "pullback": bool(pullback),
        "mean_reversion": bool(mean_reversion),
    }


def dxy_confluence(direction: str, dxy_data: dict | None) -> float:
    if not dxy_data:
        return 0.0
    dxy_price = float(dxy_data.get("price", 0) or 0)
    if dxy_price <= 0:
        return 0.0
    if direction == "BUY":
        return 0.35 if dxy_price < 104 else -0.20
    return 0.35 if dxy_price > 104 else -0.20


def score_direction(direction: str, regime: dict, structural_bias: str, conditions: dict, dxy_data: dict | None) -> float:
    score = 0.0
    direction_bias = "BUY_ONLY" if direction == "BUY" else "SELL_ONLY"

    if structural_bias == direction_bias:
        score += 1.50
    else:
        score -= 0.80

    if conditions["stochrsi"]:
        score += 1.00
    if conditions["macd"]:
        score += 1.00
    if conditions["keltner"]:
        score += 0.95
    if conditions["asian_range"]:
        score += 1.10
    if conditions["pullback"]:
        score += 0.60
    if conditions["mean_reversion"]:
        score += 1.20

    adx = regime["adx"]
    if adx >= 30:
        score += 0.40
    if adx >= 40:
        score += 0.20

    if regime["name"] == "TREND" and (conditions["macd"] or conditions["keltner"]):
        score += 0.50
    elif regime["name"] == "HIGH_VOL_BREAKOUT" and conditions["asian_range"]:
        score += 0.70
    elif regime["name"] == "RANGE" and conditions["mean_reversion"]:
        score += 0.70
    elif regime["name"] == "NEUTRAL":
        score -= 0.30

    score += dxy_confluence(direction, dxy_data)
    return score


def score_to_probability(buy_score: float, sell_score: float) -> tuple[float, float]:
    buy_exp = math.exp(max(min(buy_score, 20), -20))
    sell_exp = math.exp(max(min(sell_score, 20), -20))
    denom = buy_exp + sell_exp
    if denom == 0:
        return 0.5, 0.5
    p_buy = buy_exp / denom
    return p_buy, 1.0 - p_buy


def count_core_conditions(conditions: dict) -> int:
    keys = ("stochrsi", "macd", "keltner", "asian_range")
    return sum(1 for k in keys if conditions.get(k))


def check_active_signal() -> dict | None:
    try:
        resp = (
            supabase.table("signals")
            .select("*")
            .eq("status", "ACTIVE")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data and len(resp.data) > 0:
            return resp.data[0]
    except Exception as e:
        print(f"  WARNING: Error checking active signal: {e}")

    return None


def manage_active_signal(active_signal: dict, current_price: float):
    sig_type = active_signal["type"]
    tp1 = float(active_signal["tp1"])
    tp2 = float(active_signal["tp2"])
    tp3 = float(active_signal["tp3"])
    sl = float(active_signal["sl"])
    current_status = active_signal["status"]

    new_status = current_status

    if sig_type == "BUY":
        if current_price <= sl:
            new_status = "HIT_SL"
        elif current_price >= tp3:
            new_status = "HIT_TP3"
        elif current_price >= tp2 and current_status not in ("HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP2"
        elif current_price >= tp1 and current_status not in ("HIT_TP1", "HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP1"
    else:
        if current_price >= sl:
            new_status = "HIT_SL"
        elif current_price <= tp3:
            new_status = "HIT_TP3"
        elif current_price <= tp2 and current_status not in ("HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP2"
        elif current_price <= tp1 and current_status not in ("HIT_TP1", "HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP1"

    created = datetime.fromisoformat(active_signal["created_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created > timedelta(hours=4) and new_status == "ACTIVE":
        new_status = "EXPIRED"

    if new_status != current_status:
        print(f"  Signal {active_signal['id'][:8]} status: {current_status} -> {new_status}")
        try:
            (
                supabase.table("signals")
                .update({"status": new_status})
                .eq("id", active_signal["id"])
                .execute()
            )
        except Exception as e:
            print(f"  ERROR updating signal status: {e}")


def save_indicator_snapshot(df_m15: pd.DataFrame, df_h1: pd.DataFrame, dxy_data: dict | None):
    m15_latest = df_m15.iloc[-1]
    h1_latest = df_h1.iloc[-1]

    snapshot = {
        "adx": float(h1_latest.get("adx", 0)) if not pd.isna(h1_latest.get("adx", 0)) else 0,
        "vwap": float(h1_latest.get("vwap", 0)) if not pd.isna(h1_latest.get("vwap", 0)) else 0,
        "stochrsi_k": float(m15_latest.get("stochrsi_k", 0)) if not pd.isna(m15_latest.get("stochrsi_k", 0)) else 0,
        "stochrsi_d": float(m15_latest.get("stochrsi_d", 0)) if not pd.isna(m15_latest.get("stochrsi_d", 0)) else 0,
        "macd_histogram": float(m15_latest.get("macd_histogram", 0)) if not pd.isna(m15_latest.get("macd_histogram", 0)) else 0,
        "keltner_upper": float(m15_latest.get("keltner_upper", 0)) if not pd.isna(m15_latest.get("keltner_upper", 0)) else 0,
        "keltner_lower": float(m15_latest.get("keltner_lower", 0)) if not pd.isna(m15_latest.get("keltner_lower", 0)) else 0,
        "atr": float(m15_latest.get("atr", 0)) if not pd.isna(m15_latest.get("atr", 0)) else 0,
        "dxy_price": float(dxy_data["price"]) if dxy_data else 0,
        "dxy_direction": "FLAT",
    }

    if dxy_data and dxy_data.get("price", 0) > 0:
        snapshot["dxy_direction"] = "UP" if dxy_data["price"] > 104 else "DOWN"

    try:
        supabase.table("indicator_snapshots").insert(snapshot).execute()
        print("  Indicator snapshot saved")
    except Exception as e:
        print(f"  WARNING: Error saving snapshot: {e}")


def send_telegram_signal_alert(signal: dict, regime: dict, decision_reason: str) -> bool:
    """Send Telegram alert for newly generated BUY/SELL signals."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("  INFO: Telegram alert skipped (missing TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)")
        return False

    signal_type = signal.get("type", "HOLD")
    if signal_type not in ("BUY", "SELL"):
        return False

    icon = "BUY" if signal_type == "BUY" else "SELL"
    tf = signal.get("timeframe", "M15")
    message = (
        f"{icon} XAUUSD {signal_type} signal\n"
        f"Entry: {signal.get('entry_price')}\n"
        f"TP1: {signal.get('tp1')} | TP2: {signal.get('tp2')} | TP3: {signal.get('tp3')}\n"
        f"SL: {signal.get('sl')}\n"
        f"Confidence: {signal.get('confidence')}% | Regime: {regime.get('name', '--')} | TF: {tf}\n"
        f"Reason: {decision_reason}\n"
        f"Time(UTC): {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
    }

    try:
        resp = requests.post(url, json=payload, timeout=15)
        if resp.status_code >= 400:
            print(f"  WARNING: Telegram send failed ({resp.status_code}): {resp.text[:200]}")
            return False
        print("  Telegram alert sent")
        return True
    except Exception as exc:
        print(f"  WARNING: Telegram send error: {exc}")
        return False


def run_signal_engine():
    print(f"\n{'=' * 60}")
    print(f"Signal Engine - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'=' * 60}")

    print("\nFetching M15 candles...")
    df_m15 = fetch_candles("XAU/USD", 15, "minute", bars=140)
    if df_m15 is None or len(df_m15) < 80:
        print("  ERROR: Insufficient M15 data. Aborting.")
        return
    print(f"  OK: Got {len(df_m15)} M15 bars")

    print("Fetching H1 candles...")
    df_h1 = fetch_candles("XAU/USD", 1, "hour", bars=120)
    if df_h1 is None or len(df_h1) < 60:
        print("  ERROR: Insufficient H1 data. Aborting.")
        return
    print(f"  OK: Got {len(df_h1)} H1 bars")

    dxy_data = fetch_dxy_quote()
    if dxy_data:
        print(f"DXY: {dxy_data['price']:.2f}")
    else:
        print("DXY unavailable, using neutral confluence")

    print("\nCalculating indicators...")
    df_m15 = calculate_m15_indicators(df_m15)
    df_h1 = calculate_h1_indicators(df_h1)

    current_price = float(df_m15.iloc[-1]["Close"])
    print(f"XAUUSD current price: ${current_price:,.2f}")

    asian_range = get_asian_session_range(df_m15)
    if asian_range:
        print(f"Asian range: ${asian_range['low']:,.2f} -> ${asian_range['high']:,.2f}")
    else:
        print("Asian range: unavailable")

    structural_bias = get_structural_bias(df_h1)
    regime = classify_regime(df_m15, df_h1, asian_range)
    print(
        f"Regime: {regime['name']} | Bias: {structural_bias} | "
        f"ADX: {regime['adx']:.1f} | ATR: {regime['atr']:.2f} | ATR ratio: {regime['atr_ratio']:.2f}"
    )

    buy_conditions = build_direction_conditions(df_m15, "BUY", asian_range, regime["name"])
    sell_conditions = build_direction_conditions(df_m15, "SELL", asian_range, regime["name"])

    buy_score = score_direction("BUY", regime, structural_bias, buy_conditions, dxy_data)
    sell_score = score_direction("SELL", regime, structural_bias, sell_conditions, dxy_data)
    p_buy, p_sell = score_to_probability(buy_score, sell_score)

    buy_core_count = count_core_conditions(buy_conditions)
    sell_core_count = count_core_conditions(sell_conditions)

    active_signal = check_active_signal()
    if active_signal:
        print(f"Active signal exists ({active_signal['type']} @ ${float(active_signal['entry_price']):,.2f})")
        manage_active_signal(active_signal, current_price)

    news_blackout = check_news_blackout()
    risk_guard = get_risk_guard_state()

    action = "HOLD"
    decision_reason = "insufficient_edge"
    selected_conditions = buy_conditions if p_buy >= p_sell else sell_conditions

    if active_signal is not None:
        decision_reason = "active_signal_exists"
    elif news_blackout:
        decision_reason = "news_blackout"
    elif not risk_guard["allow_entry"]:
        decision_reason = risk_guard["reason"]
    elif p_buy >= BUY_PROB_THRESHOLD and buy_core_count >= MIN_CONFIRMATIONS and p_buy > p_sell:
        action = "BUY"
        decision_reason = "buy_threshold_met"
        selected_conditions = buy_conditions
    elif p_buy <= SELL_PROB_THRESHOLD and sell_core_count >= MIN_CONFIRMATIONS and p_sell > p_buy:
        action = "SELL"
        decision_reason = "sell_threshold_met"
        selected_conditions = sell_conditions

    confidence = int(round(max(p_buy, p_sell) * 100))
    decision_packet = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "regime": regime["name"],
        "regime_reason": regime["reason"],
        "structural_bias": structural_bias,
        "buy_score": round(buy_score, 4),
        "sell_score": round(sell_score, 4),
        "p_buy": round(p_buy, 4),
        "p_sell": round(p_sell, 4),
        "buy_confirmations": buy_core_count,
        "sell_confirmations": sell_core_count,
        "risk_guard": risk_guard,
        "news_blackout": news_blackout,
        "action": action,
        "reason": decision_reason,
        "confidence": confidence,
    }

    print("\nDecision packet:")
    print(json.dumps(decision_packet, indent=2))

    if action in ("BUY", "SELL"):
        atr = regime["atr"]
        if pd.isna(atr) or atr <= 0:
            atr = float(df_m15.iloc[-1].get("atr", 0) or 0)
        if pd.isna(atr) or atr <= 0:
            atr = current_price * 0.003

        if action == "BUY":
            sl = current_price - (atr * STOP_MULTIPLIER)
            tp1 = current_price + (atr * TP1_MULTIPLIER)
            tp2 = current_price + (atr * TP2_MULTIPLIER)
            tp3 = current_price + (atr * TP3_MULTIPLIER)
        else:
            sl = current_price + (atr * STOP_MULTIPLIER)
            tp1 = current_price - (atr * TP1_MULTIPLIER)
            tp2 = current_price - (atr * TP2_MULTIPLIER)
            tp3 = current_price - (atr * TP3_MULTIPLIER)

        conditions_payload = {
            "stochrsi": bool(selected_conditions.get("stochrsi", False)),
            "macd": bool(selected_conditions.get("macd", False)),
            "keltner": bool(selected_conditions.get("keltner", False)),
            "asian_range": bool(selected_conditions.get("asian_range", False)),
            "pullback": bool(selected_conditions.get("pullback", False)),
            "mean_reversion": bool(selected_conditions.get("mean_reversion", False)),
            "regime": regime["name"],
            "regime_reason": regime["reason"],
            "decision_reason": decision_reason,
            "structural_bias": structural_bias,
            "buy_score": round(buy_score, 4),
            "sell_score": round(sell_score, 4),
            "p_buy": round(p_buy, 4),
            "p_sell": round(p_sell, 4),
        }

        signal = {
            "type": action,
            "entry_price": round(current_price, 2),
            "tp1": round(tp1, 2),
            "tp2": round(tp2, 2),
            "tp3": round(tp3, 2),
            "sl": round(sl, 2),
            "status": "ACTIVE",
            "confidence": confidence,
            "conditions_met": json.dumps(conditions_payload),
            "adx_value": round(regime["adx"], 2),
            "atr_value": round(atr, 2),
            "timeframe": "M15",
        }

        try:
            supabase.table("signals").insert(signal).execute()
            print(f"\nSignal stored: {action} | Entry {current_price:,.2f} | Confidence {confidence}%")
            print(f"TP1 {tp1:,.2f} | TP2 {tp2:,.2f} | TP3 {tp3:,.2f} | SL {sl:,.2f}")
            send_telegram_signal_alert(signal, regime, decision_reason)
        except Exception as e:
            print(f"ERROR inserting signal: {e}")
    else:
        print(f"\nNo trade this cycle: {decision_reason}")

    print("\nSaving indicator snapshot...")
    save_indicator_snapshot(df_m15, df_h1, dxy_data)

    print(f"\n{'=' * 60}")
    print("Signal engine run complete")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    run_signal_engine()
