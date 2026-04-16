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
import requests
import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ── Config ──────────────────────────────────────────────────────────
MASSIVE_API_KEY = os.getenv("MASSIVE_API_KEY", "34FMvo_3DD6hL54apDwMKPXNk_aa86uv")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BASE_URL = "https://api.polygon.io"

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Asian Session Range (00:00–08:00 UTC) ───────────────────────────
ASIAN_SESSION_START_HOUR = 0
ASIAN_SESSION_END_HOUR = 8


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
            print(f"  ⚠️  No results for {symbol} {multiplier}{timespan}")
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
        print(f"  ❌ API error fetching {symbol}: {e}")
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
        print(f"  ⚠️  DXY fetch error: {e}")
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

    # Keltner Channels(20, 2×ATR)
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
    """Calculate today's Asian session (00:00–08:00 UTC) high/low."""
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
    STEP 1 — Regime check.
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
    """
    STEP 2 — Check if there's a high-impact event within ±30 minutes.
    Returns True if we should SKIP signal generation.
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=30)
    window_end = now + timedelta(minutes=30)

    try:
        resp = supabase.table("economic_events") \
            .select("*") \
            .eq("impact", "HIGH") \
            .gte("event_date", window_start.isoformat()) \
            .lte("event_date", window_end.isoformat()) \
            .execute()

        if resp.data and len(resp.data) > 0:
            event = resp.data[0]
            print(f"  ⚠️  News blackout: {event['event_name']} within 30min window")
            return True
    except Exception as e:
        print(f"  ⚠️  Could not check news: {e}")

    return False


def get_structural_bias(df_h1: pd.DataFrame) -> str:
    """
    STEP 3 — Structural bias from VWAP.
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


def check_entry_conditions(df_m15: pd.DataFrame, bias: str, asian_range: dict | None) -> dict:
    """
    STEP 4 — Check 4 entry conditions on M15 data.
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
    """STEP 5 (partial) — Confidence score calculation."""
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
        # We'd need DXY direction — simplified: if we have a price, give partial credit
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
        print(f"  ⚠️  Error checking active signal: {e}")

    return None


def manage_active_signal(active_signal: dict, current_price: float):
    """
    STEP 6 — Check if active signal hit any TP or SL.
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
        print(f"  📊 Signal {active_signal['id'][:8]}... status: {current_status} → {new_status}")
        try:
            supabase.table("signals") \
                .update({"status": new_status}) \
                .eq("id", active_signal["id"]) \
                .execute()
        except Exception as e:
            print(f"  ❌ Error updating signal status: {e}")


def save_indicator_snapshot(df_m15: pd.DataFrame, df_h1: pd.DataFrame, dxy_data: dict | None):
    """STEP 7 — Save current indicator values to Supabase."""
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
        print("  💾 Indicator snapshot saved")
    except Exception as e:
        print(f"  ⚠️  Error saving snapshot: {e}")


def run_signal_engine():
    """Main signal generation pipeline — runs once per invocation."""
    print(f"\n{'='*60}")
    print(f"🤖 Signal Engine — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*60}")

    # ── Fetch data ──────────────────────────────────────────────
    print("\n📡 Fetching M15 candles...")
    df_m15 = fetch_candles("C:XAUUSD", 15, "minute", bars=100)
    if df_m15 is None or len(df_m15) < 50:
        print("  ❌ Insufficient M15 data. Aborting.")
        return

    print(f"  ✅ Got {len(df_m15)} M15 bars")

    print("📡 Fetching H1 candles...")
    df_h1 = fetch_candles("C:XAUUSD", 1, "hour", bars=50)
    if df_h1 is None or len(df_h1) < 20:
        print("  ❌ Insufficient H1 data. Aborting.")
        return

    print(f"  ✅ Got {len(df_h1)} H1 bars")

    print("📡 Fetching DXY quote...")
    dxy_data = fetch_dxy_quote()
    if dxy_data:
        print(f"  ✅ DXY: {dxy_data['price']:.2f}")
    else:
        print("  ⚠️  DXY unavailable, continuing without")

    # ── Calculate indicators ────────────────────────────────────
    print("\n📐 Calculating indicators...")
    df_m15 = calculate_m15_indicators(df_m15)
    df_h1 = calculate_h1_indicators(df_h1)

    current_price = float(df_m15.iloc[-1]["Close"])
    print(f"  💰 XAUUSD current price: ${current_price:,.2f}")

    # ── STEP 1: Regime check ────────────────────────────────────
    print("\n🔍 Step 1: Regime check...")
    regime = check_regime(df_h1)
    print(f"  ADX: {regime['adx']:.1f} | ATR: {regime['atr']:.2f} | {regime['reason']}")

    if not regime["active"]:
        print("  ⏸️  Regime not active — saving snapshot and exiting")
        save_indicator_snapshot(df_m15, df_h1, dxy_data)
        # Still manage active signals even when no new signal generated
        active = check_active_signal()
        if active:
            manage_active_signal(active, current_price)
        return

    # ── STEP 2: News filter ─────────────────────────────────────
    print("\n📰 Step 2: News filter...")
    if check_news_blackout():
        print("  ⏸️  News blackout — saving snapshot and exiting")
        save_indicator_snapshot(df_m15, df_h1, dxy_data)
        active = check_active_signal()
        if active:
            manage_active_signal(active, current_price)
        return

    print("  ✅ No high-impact news in window")

    # ── STEP 3: Structural bias ─────────────────────────────────
    print("\n🧭 Step 3: Structural bias...")
    bias = get_structural_bias(df_h1)
    print(f"  📌 Bias: {bias}")

    # ── STEP 4: Entry conditions ────────────────────────────────
    print("\n🎯 Step 4: Entry conditions...")
    asian_range = get_asian_session_range(df_m15)
    if asian_range:
        print(f"  🌏 Asian range: ${asian_range['low']:,.2f} – ${asian_range['high']:,.2f}")
    else:
        print("  🌏 Asian range: Not available")

    entry_check = check_entry_conditions(df_m15, bias, asian_range)
    print(f"  Conditions met: {entry_check['count']}/4")
    for cond, hit in entry_check["conditions"].items():
        icon = "✅" if hit else "❌"
        print(f"    {icon} {cond}")

    # ── STEP 5: Generate signal ─────────────────────────────────
    active = check_active_signal()

    if entry_check["count"] >= 3 and active is None:
        print("\n🚀 Step 5: Generating signal!")

        atr = float(df_m15.iloc[-1].get("atr", 0))
        if pd.isna(atr) or atr == 0:
            atr = current_price * 0.003  # Fallback

        signal_type = "BUY" if bias == "BUY_ONLY" else "SELL"

        if signal_type == "BUY":
            sl = current_price - (atr * 1.5)
            tp1 = current_price + (atr * 1.0)
            tp2 = current_price + (atr * 2.0)
            tp3 = current_price + (atr * 3.0)
        else:
            sl = current_price + (atr * 1.5)
            tp1 = current_price - (atr * 1.0)
            tp2 = current_price - (atr * 2.0)
            tp3 = current_price - (atr * 3.0)

        confidence = calculate_confidence(entry_check["count"], regime["adx"], dxy_data, bias)

        signal = {
            "type": signal_type,
            "entry_price": round(current_price, 2),
            "tp1": round(tp1, 2),
            "tp2": round(tp2, 2),
            "tp3": round(tp3, 2),
            "sl": round(sl, 2),
            "status": "ACTIVE",
            "confidence": confidence,
            "conditions_met": json.dumps(entry_check["conditions"]),
            "adx_value": round(regime["adx"], 2),
            "atr_value": round(atr, 2),
            "timeframe": "M15",
        }

        try:
            resp = supabase.table("signals").insert(signal).execute()
            print(f"  ✅ {signal_type} signal stored!")
            print(f"     Entry: ${current_price:,.2f}")
            print(f"     TP1: ${tp1:,.2f} | TP2: ${tp2:,.2f} | TP3: ${tp3:,.2f}")
            print(f"     SL: ${sl:,.2f}")
            print(f"     Confidence: {confidence}%")
        except Exception as e:
            print(f"  ❌ Error inserting signal: {e}")

    elif active:
        print(f"\n📊 Step 5: Active signal exists ({active['type']} @ ${float(active['entry_price']):,.2f})")
        manage_active_signal(active, current_price)
    else:
        print(f"\n⏳ Step 5: Only {entry_check['count']}/4 conditions met — no signal")

    # ── STEP 7: Save indicator snapshot ─────────────────────────
    print("\n💾 Step 7: Saving indicator snapshot...")
    save_indicator_snapshot(df_m15, df_h1, dxy_data)

    print(f"\n{'='*60}")
    print("✅ Signal engine run complete")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_signal_engine()
