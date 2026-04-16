"""
XAUUSD Trading Signal Generator
================================
Runs every 5 minutes via GitHub Actions.
Fetches M15/H1 candles from Massive.com (Polygon.io compatible API),
computes indicators, generates BUY/SELL signals, and writes to Supabase.
"""

import os
import time
import json
import math
import requests
import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
MASSIVE_API_KEY = os.getenv("MASSIVE_API_KEY", "34FMvo_3DD6hL54apDwMKPXNk_aa86uv")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BASE_URL = "https://api.polygon.io"

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# â”€â”€ Asian Session Range (00:00â€“08:00 UTC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ASIAN_SESSION_START_HOUR = 0
ASIAN_SESSION_END_HOUR = 8

# Signal framework config
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
    """
    Fetch OHLCV candles from Massive.com / Polygon-compatible API.
    symbol: e.g. "C:XAUUSD"
    multiplier: e.g. 15 (for 15-min)
    timespan: "minute" or "hour"
    bars: how many bars to fetch
    """
    now = datetime.now(timezone.utc)

    # Calculate 'from' timestamp based on bars requested
    if timespan == "minute":
        delta = timedelta(minutes=multiplier * bars + 60)
    else:
        delta = timedelta(hours=multiplier * bars + 4)

    from_ts = int((now - delta).timestamp() * 1000)
    to_ts = int(now.timestamp() * 1000)

    url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from_ts}/{to_ts}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": bars,
        "apiKey": MASSIVE_API_KEY,
    }

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        if data.get("resultsCount", 0) == 0:
            print(f"  âš ï¸  No results for {symbol} {multiplier}{timespan}")
            return None

        results = data["results"]
        df = pd.DataFrame(results)
        df = df.rename(columns={
            "o": "Open",
            "h": "High",
            "l": "Low",
            "c": "Close",
            "v": "Volume",
            "t": "Timestamp",
        })
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], unit="ms", utc=True)
        df = df.set_index("Timestamp")
        df = df[["Open", "High", "Low", "Close", "Volume"]].astype(float)
        return df

    except Exception as e:
        print(f"  âŒ API error fetching {symbol}: {e}")
        return None


def fetch_dxy_quote() -> dict | None:
    """Fetch latest DXY quote for correlation analysis."""
    url = f"{BASE_URL}/v2/aggs/ticker/C:DXY/prev"
    params = {"adjusted": "true", "apiKey": MASSIVE_API_KEY}
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if "results" in data and len(data["results"]) > 0:
            r = data["results"][0]
            return {"price": r.get("c", 0)}
        return None
    except Exception as e:
        print(f"  âš ï¸  DXY fetch error: {e}")
        return None


def calculate_m15_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate entry-timing indicators on M15 data."""
    # StochRSI(14,3,3)
    stochrsi = df.ta.stochrsi(length=14, rsi_length=14, k=3, d=3)
    if stochrsi is not None:
        df["stochrsi_k"] = stochrsi.iloc[:, 0]
        df["stochrsi_d"] = stochrsi.iloc[:, 1]

    # MACD(12,26,9)
    macd = df.ta.macd(fast=12, slow=26, signal=9)
    if macd is not None:
        df["macd_line"] = macd.iloc[:, 0]
        df["macd_signal"] = macd.iloc[:, 1]
        df["macd_histogram"] = macd.iloc[:, 2]

    # Keltner Channels(20, 2Ã—ATR)
    kc = df.ta.kc(length=20, scalar=2)
    if kc is not None:
        df["keltner_lower"] = kc.iloc[:, 0]
        df["keltner_mid"] = kc.iloc[:, 1]
        df["keltner_upper"] = kc.iloc[:, 2]

    # ATR(14)
    df["atr"] = df.ta.atr(length=14)

    return df


def calculate_h1_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate structural-confirmation indicators on H1 data."""
    # ADX(14)
    adx = df.ta.adx(length=14)
    if adx is not None:
        df["adx"] = adx.iloc[:, 0]  # ADX value
        df["dmp"] = adx.iloc[:, 1]  # +DI
        df["dmn"] = adx.iloc[:, 2]  # -DI

    # VWAP (session-based)
    vwap = df.ta.vwap()
    if vwap is not None:
        df["vwap"] = vwap

    # SMA(50)
    df["sma50"] = df.ta.sma(length=50)

    return df


def get_asian_session_range(df_m15: pd.DataFrame) -> dict | None:
    """Calculate today's Asian session (00:00â€“08:00 UTC) high/low."""
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


def check_regime(df_h1: pd.DataFrame) -> dict:
    """
    STEP 1 â€” Regime check.
    Returns: {"active": bool, "reason": str, "adx": float, "atr": float}
    """
    latest = df_h1.iloc[-1]
    adx_val = latest.get("adx", 0)
    atr_val = latest.get("atr", 0) if "atr" in latest else 0

    # Compute ATR on H1 if not present
    if atr_val == 0:
        h1_atr = df_h1.ta.atr(length=14)
        if h1_atr is not None and len(h1_atr) > 0:
            atr_val = float(h1_atr.iloc[-1])

    # ADX threshold
    if pd.isna(adx_val) or adx_val < 20:
        return {"active": False, "reason": "No trend (ADX < 20)", "adx": float(adx_val or 0), "atr": float(atr_val)}

    # ATR must be above 20th percentile of last 100 bars
    atr_series = df_h1.ta.atr(length=14)
    if atr_series is not None and len(atr_series) > 10:
        atr_20th = atr_series.quantile(0.2)
        if atr_val < atr_20th:
            return {"active": False, "reason": "Dead market (ATR below 20th pct)", "adx": float(adx_val), "atr": float(atr_val)}

    return {"active": True, "reason": "Trending", "adx": float(adx_val), "atr": float(atr_val)}


def check_news_blackout() -> bool:
    """Return True when a high-impact event is in the configured blackout window."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=NEWS_BLACKOUT_MINUTES)
    window_end = now + timedelta(minutes=NEWS_BLACKOUT_MINUTES)

    try:
        resp = supabase.table("economic_events") \
            .select("*") \
            .eq("impact", "HIGH") \
            .gte("event_date", window_start.isoformat()) \
            .lte("event_date", window_end.isoformat()) \
            .execute()

        if resp.data and len(resp.data) > 0:
            event = resp.data[0]
            print(f"  WARNING: News blackout: {event['event_name']} within +/-{NEWS_BLACKOUT_MINUTES}m window")
            return True
    except Exception as e:
        print(f"  WARNING: Could not check news: {e}")

    return False

def get_structural_bias(df_h1: pd.DataFrame) -> str:
    """
    STEP 3 â€” Structural bias from VWAP.
    Returns "BUY_ONLY" or "SELL_ONLY"
    """
    latest = df_h1.iloc[-1]
    vwap = latest.get("vwap", None)
    close = latest["Close"]

    if vwap is None or pd.isna(vwap):
        # Fallback: use SMA50
        sma = latest.get("sma50", None)
        if sma is not None and not pd.isna(sma):
            return "BUY_ONLY" if close > sma else "SELL_ONLY"
        return "BUY_ONLY"  # Default bullish

    return "BUY_ONLY" if close > vwap else "SELL_ONLY"


def parse_signal_time(ts: str | None) -> datetime | None:
    """Parse Supabase timestamp safely."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def get_risk_guard_state() -> dict:
    """
    Risk guard:
    1) cooldown after latest SL
    2) block after too many consecutive SL outcomes
    """
    try:
        resp = supabase.table("signals") \
            .select("status,created_at") \
            .neq("status", "ACTIVE") \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        closed = resp.data or []
    except Exception as e:
        print(f"  âš ï¸ Could not read signal history for risk guard: {e}")
        return {
            "allow_entry": True,
            "reason": "history_unavailable",
            "cooldown_minutes_left": 0,
            "consecutive_sl": 0,
        }

    consecutive_sl = 0
    for row in closed:
        status = row.get("status")
        if status == "HIT_SL":
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
    """Classify market regime for the decision engine."""
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


def build_direction_conditions(
    df_m15: pd.DataFrame,
    direction: str,
    asian_range: dict | None,
    regime_name: str
) -> dict:
    """Direction-specific condition map used by the score engine."""
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
        asian_breakout = (
            asian_range is not None and atr > 0 and close > (asian_range["high"] + (atr * BREAKOUT_BUFFER_ATR))
        )
        mean_reversion = (
            regime_name == "RANGE" and kc_lower is not None and not pd.isna(kc_lower) and k_now < 15 and close <= float(kc_lower)
        )
    else:
        stochrsi = (k_prev > d_prev and k_now < d_now and k_now > 65)
        macd = (hist_now < hist_prev and hist_now < 0)
        keltner = (kc_lower is not None and not pd.isna(kc_lower) and close < float(kc_lower))
        pullback = (kc_mid is not None and not pd.isna(kc_mid) and close <= float(kc_mid))
        asian_breakout = (
            asian_range is not None and atr > 0 and close < (asian_range["low"] - (atr * BREAKOUT_BUFFER_ATR))
        )
        mean_reversion = (
            regime_name == "RANGE" and kc_upper is not None and not pd.isna(kc_upper) and k_now > 85 and close >= float(kc_upper)
        )

    return {
        "stochrsi": bool(stochrsi),
        "macd": bool(macd),
        "keltner": bool(keltner),
        "asian_range": bool(asian_breakout),
        "pullback": bool(pullback),
        "mean_reversion": bool(mean_reversion),
    }


def dxy_confluence(direction: str, dxy_data: dict | None) -> float:
    """Simple DXY confluence score for gold (inverse tendency)."""
    if not dxy_data:
        return 0.0
    dxy_price = float(dxy_data.get("price", 0) or 0)
    if dxy_price <= 0:
        return 0.0

    # Lightweight proxy around broad DXY baseline.
    if direction == "BUY":
        return 0.35 if dxy_price < 104 else -0.20
    return 0.35 if dxy_price > 104 else -0.20


def score_direction(
    direction: str,
    regime: dict,
    structural_bias: str,
    conditions: dict,
    dxy_data: dict | None
) -> float:
    """Weighted score for BUY or SELL path."""
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
    """Convert directional scores into probabilities via softmax."""
    buy_exp = math.exp(max(min(buy_score, 20), -20))
    sell_exp = math.exp(max(min(sell_score, 20), -20))
    denom = buy_exp + sell_exp
    if denom == 0:
        return 0.5, 0.5
    p_buy = buy_exp / denom
    return p_buy, 1.0 - p_buy


def count_core_conditions(conditions: dict) -> int:
    """Count core conditions used in DB payload and gating."""
    keys = ("stochrsi", "macd", "keltner", "asian_range")
    return sum(1 for k in keys if conditions.get(k))


def check_entry_conditions(df_m15: pd.DataFrame, bias: str, asian_range: dict | None) -> dict:
    """
    STEP 4 â€” Check 4 entry conditions on M15 data.
    Need 3 of 4 to trigger.
    Returns: {"count": int, "conditions": dict}
    """
    latest = df_m15.iloc[-1]
    prev = df_m15.iloc[-2]
    conditions = {}

    # a) StochRSI crossover in extreme zone
    k_now = latest.get("stochrsi_k", 50)
    d_now = latest.get("stochrsi_d", 50)
    k_prev = prev.get("stochrsi_k", 50)
    d_prev = prev.get("stochrsi_d", 50)

    if bias == "BUY_ONLY":
        # %K crosses above %D in oversold zone (<20)
        stochrsi_trigger = (k_prev < d_prev and k_now > d_now and k_now < 30)
    else:
        # %K crosses below %D in overbought zone (>80)
        stochrsi_trigger = (k_prev > d_prev and k_now < d_now and k_now > 70)

    conditions["stochrsi"] = bool(stochrsi_trigger)

    # b) MACD histogram acceleration in bias direction
    hist_now = latest.get("macd_histogram", 0)
    hist_prev = prev.get("macd_histogram", 0)

    if pd.isna(hist_now):
        hist_now = 0
    if pd.isna(hist_prev):
        hist_prev = 0

    if bias == "BUY_ONLY":
        macd_trigger = (hist_now > hist_prev and hist_now > 0)
    else:
        macd_trigger = (hist_now < hist_prev and hist_now < 0)

    conditions["macd"] = bool(macd_trigger)

    # c) Price closed beyond Keltner Channel
    kc_upper = latest.get("keltner_upper", None)
    kc_lower = latest.get("keltner_lower", None)
    close = latest["Close"]

    if bias == "BUY_ONLY" and kc_upper is not None and not pd.isna(kc_upper):
        keltner_trigger = close > kc_upper
    elif bias == "SELL_ONLY" and kc_lower is not None and not pd.isna(kc_lower):
        keltner_trigger = close < kc_lower
    else:
        keltner_trigger = False

    conditions["keltner"] = bool(keltner_trigger)

    # d) Asian Session Range breakout
    if asian_range is not None:
        if bias == "BUY_ONLY":
            asian_trigger = close > asian_range["high"]
        else:
            asian_trigger = close < asian_range["low"]
    else:
        asian_trigger = False

    conditions["asian_range"] = bool(asian_trigger)

    count = sum(1 for v in conditions.values() if v)
    return {"count": count, "conditions": conditions}


def calculate_confidence(conditions_count: int, adx: float, dxy_data: dict | None, bias: str) -> int:
    """STEP 5 (partial) â€” Confidence score calculation."""
    confidence = 0

    # Base from conditions count
    if conditions_count == 3:
        confidence = 75
    elif conditions_count >= 4:
        confidence = 90

    # ADX strength bonus
    if adx > 30:
        confidence += 5
    if adx > 40:
        confidence += 5  # Total +10

    # DXY confluence bonus (gold is inversely correlated with USD)
    if dxy_data and dxy_data.get("price", 0) > 0:
        # We'd need DXY direction â€” simplified: if we have a price, give partial credit
        confidence += 3

    return min(confidence, 100)


def check_active_signal() -> dict | None:
    """Check if there's already an active signal."""
    try:
        resp = supabase.table("signals") \
            .select("*") \
            .eq("status", "ACTIVE") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if resp.data and len(resp.data) > 0:
            return resp.data[0]
    except Exception as e:
        print(f"  âš ï¸  Error checking active signal: {e}")

    return None


def manage_active_signal(active_signal: dict, current_price: float):
    """
    STEP 6 â€” Check if active signal hit any TP or SL.
    Updates signal status in Supabase.
    """
    sig_type = active_signal["type"]
    entry = float(active_signal["entry_price"])
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
    else:  # SELL
        if current_price >= sl:
            new_status = "HIT_SL"
        elif current_price <= tp3:
            new_status = "HIT_TP3"
        elif current_price <= tp2 and current_status not in ("HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP2"
        elif current_price <= tp1 and current_status not in ("HIT_TP1", "HIT_TP2", "HIT_TP3"):
            new_status = "HIT_TP1"

    # Check expiration (signal older than 4 hours)
    created = datetime.fromisoformat(active_signal["created_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created > timedelta(hours=4):
        if new_status == "ACTIVE":
            new_status = "EXPIRED"

    if new_status != current_status:
        print(f"  ðŸ“Š Signal {active_signal['id'][:8]}... status: {current_status} â†’ {new_status}")
        try:
            supabase.table("signals") \
                .update({"status": new_status}) \
                .eq("id", active_signal["id"]) \
                .execute()
        except Exception as e:
            print(f"  âŒ Error updating signal status: {e}")


def save_indicator_snapshot(df_m15: pd.DataFrame, df_h1: pd.DataFrame, dxy_data: dict | None):
    """STEP 7 â€” Save current indicator values to Supabase."""
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

    # Determine DXY direction from recent H1 bars
    if dxy_data and dxy_data.get("price", 0) > 0:
        # Simple: compare to VWAP-like average
        snapshot["dxy_direction"] = "UP" if dxy_data["price"] > 104 else "DOWN"  # Simplified

    try:
        supabase.table("indicator_snapshots").insert(snapshot).execute()
        print("  ðŸ’¾ Indicator snapshot saved")
    except Exception as e:
        print(f"  âš ï¸  Error saving snapshot: {e}")


def run_signal_engine():
    """Main signal generation pipeline - runs once per invocation."""
    print(f"\n{'=' * 60}")
    print(f"Signal Engine - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'=' * 60}")

    print("\nFetching M15 candles...")
    df_m15 = fetch_candles("C:XAUUSD", 15, "minute", bars=140)
    if df_m15 is None or len(df_m15) < 80:
        print("  ERROR: Insufficient M15 data. Aborting.")
        return

    print(f"  OK: Got {len(df_m15)} M15 bars")

    print("Fetching H1 candles...")
    df_h1 = fetch_candles("C:XAUUSD", 1, "hour", bars=120)
    if df_h1 is None or len(df_h1) < 60:
        print("  ERROR: Insufficient H1 data. Aborting.")
        return

    print(f"  OK: Got {len(df_h1)} H1 bars")

    dxy_data = fetch_dxy_quote()
    if dxy_data:
        print(f"DXY: {dxy_data['price']:.2f}")
    else:
        print("DXY unavailable, continuing without confluence")

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


