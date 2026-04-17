"""
XAUUSD Trading Signal Engine v2
================================
Decision engine with:
- Dual lane signals (intraday + swing)
- Weighted scoring model
- Hard gates (news/spread/RR/stop-band)
- Daily guardrails (persistent in Supabase)
- Rejected-candidate logging for explainability
"""

import json
import math
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

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
ACCOUNT_EQUITY_DEFAULT = float(os.getenv("ACCOUNT_EQUITY", "10000"))
REQUESTS_TRUST_ENV = os.getenv("REQUESTS_TRUST_ENV", "false").strip().lower() in ("1", "true", "yes", "on")
if not REQUESTS_TRUST_ENV:
    for _proxy_key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        os.environ.pop(_proxy_key, None)

HTTP = requests.Session()
HTTP.trust_env = REQUESTS_TRUST_ENV

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SIGNAL_STATUS_CLOSED = ("HIT_TP1", "HIT_TP2", "HIT_TP3", "HIT_SL", "EXPIRED")
SIGNAL_STATUS_REJECTED = "REJECTED"

NEWS_HIGH_BLACKOUT_BEFORE_MIN = 20
NEWS_HIGH_BLACKOUT_AFTER_MIN = 20
NEWS_MEDIUM_PENALTY_BEFORE_MIN = 60
NEWS_MEDIUM_PENALTY_AFTER_MIN = 30
NEWS_MEDIUM_SCORE_PENALTY = 10

DAILY_MAX_LOSS_PCT = 2.0
MAX_CONSECUTIVE_SL = 3
DAILY_COOLDOWN_MINUTES = 90

ASIAN_SESSION_START_HOUR = 0
ASIAN_SESSION_END_HOUR = 8


@dataclass
class LaneConfig:
    name: str
    trigger_timespan: str
    trigger_multiplier: int
    confirm_timespan: str
    confirm_multiplier: int
    threshold: int
    risk_percent: float
    stop_multiplier: float
    min_rr_tp2: float
    timeframe_label: str


LANES = {
    "intraday": LaneConfig(
        name="intraday",
        trigger_timespan="minute",
        trigger_multiplier=15,
        confirm_timespan="hour",
        confirm_multiplier=1,
        threshold=70,
        risk_percent=0.50,
        stop_multiplier=1.50,
        min_rr_tp2=1.8,
        timeframe_label="M15",
    ),
    "swing": LaneConfig(
        name="swing",
        trigger_timespan="hour",
        trigger_multiplier=1,
        confirm_timespan="hour",
        confirm_multiplier=4,
        threshold=72,
        risk_percent=0.75,
        stop_multiplier=1.80,
        min_rr_tp2=2.2,
        timeframe_label="H1",
    ),
}


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except Exception:
        return default


def parse_json_object(value: Any) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def fetch_candles(symbol: str, multiplier: int, timespan: str, bars: int = 220) -> pd.DataFrame | None:
    if not TWELVE_DATA_API_KEY:
        print("  ERROR: Missing TWELVE_DATA_API_KEY")
        return None

    interval = f"{multiplier}min" if timespan == "minute" else f"{multiplier}h"
    try:
        resp = HTTP.get(
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
        payload = resp.json()
        if str(payload.get("status", "")).lower() == "error":
            print(f"  ERROR: Twelve Data {interval}: {payload.get('message', 'unknown')}")
            return None

        values = payload.get("values", [])
        if not values:
            return None

        df = pd.DataFrame(values).rename(
            columns={"open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume", "datetime": "Timestamp"}
        )
        if "Volume" not in df.columns:
            df["Volume"] = 0
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], utc=True, errors="coerce")
        df = df.dropna(subset=["Timestamp"]).set_index("Timestamp")
        return df[["Open", "High", "Low", "Close", "Volume"]].astype(float).sort_index().tail(bars)
    except Exception as e:
        print(f"  ERROR fetching candles ({interval}): {e}")
        return None


def fetch_dxy_quote() -> dict | None:
    if not TWELVE_DATA_API_KEY:
        return None
    try:
        resp = HTTP.get(
            f"{TWELVE_BASE_URL}/price",
            params={"symbol": "DXY", "apikey": TWELVE_DATA_API_KEY},
            timeout=15,
        )
        resp.raise_for_status()
        payload = resp.json()
        if str(payload.get("status", "")).lower() == "error":
            return None
        if payload.get("price") is None:
            return None
        return {"price": safe_float(payload.get("price"), 0.0)}
    except Exception:
        return None


def fetch_latest_spread() -> dict:
    try:
        resp = (
            supabase.table("market_ticks")
            .select("created_at,bid,ask,source")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        row = (resp.data or [None])[0]
        if not row:
            return {"spread": None, "source": "unknown"}
        bid = safe_float(row.get("bid"), 0)
        ask = safe_float(row.get("ask"), 0)
        spread = (ask - bid) if ask > 0 and bid > 0 and ask >= bid else None
        return {"spread": spread, "source": (row.get("source") or "unknown").upper()}
    except Exception as e:
        print(f"  WARNING: spread query failed: {e}")
        return {"spread": None, "source": "unknown"}


def calculate_trigger_indicators(df: pd.DataFrame) -> pd.DataFrame:
    close = df["Close"]
    high = df["High"]
    low = df["Low"]

    stoch = StochRSIIndicator(close=close, window=14, smooth1=3, smooth2=3)
    df["stochrsi_k"] = stoch.stochrsi_k() * 100.0
    df["stochrsi_d"] = stoch.stochrsi_d() * 100.0

    macd = MACD(close=close, window_fast=12, window_slow=26, window_sign=9)
    df["macd_histogram"] = macd.macd_diff()

    kc = KeltnerChannel(high=high, low=low, close=close, window=20, window_atr=10, original_version=False)
    df["keltner_lower"] = kc.keltner_channel_lband()
    df["keltner_mid"] = kc.keltner_channel_mband()
    df["keltner_upper"] = kc.keltner_channel_hband()

    atr = AverageTrueRange(high=high, low=low, close=close, window=14)
    df["atr"] = atr.average_true_range()
    return df


def calculate_confirm_indicators(df: pd.DataFrame) -> pd.DataFrame:
    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"].fillna(0)

    adx = ADXIndicator(high=high, low=low, close=close, window=14)
    df["adx"] = adx.adx()
    df["sma50"] = close.rolling(window=50, min_periods=1).mean()
    typical_price = (high + low + close) / 3.0
    cum_vol = volume.cumsum()
    df["vwap"] = (typical_price * volume).cumsum() / cum_vol.replace(0, pd.NA)
    return df


def get_session_context() -> dict:
    h = datetime.now(timezone.utc).hour
    is_asia = 0 <= h < 8
    is_london = 7 <= h < 16
    is_ny = 12 <= h < 21
    is_overlap = 12 <= h < 16
    if is_overlap:
        name = "LONDON_NY_OVERLAP"
    elif is_asia:
        name = "ASIA"
    elif is_london:
        name = "LONDON"
    elif is_ny:
        name = "NEW_YORK"
    else:
        name = "OFF_HOURS"
    return {"name": name, "is_asia": is_asia, "is_overlap": is_overlap}


def get_news_context() -> dict:
    now = datetime.now(timezone.utc)
    high_start = now - timedelta(minutes=NEWS_HIGH_BLACKOUT_BEFORE_MIN)
    high_end = now + timedelta(minutes=NEWS_HIGH_BLACKOUT_AFTER_MIN)
    med_start = now - timedelta(minutes=NEWS_MEDIUM_PENALTY_BEFORE_MIN)
    med_end = now + timedelta(minutes=NEWS_MEDIUM_PENALTY_AFTER_MIN)
    out = {"high_blackout": False, "medium_penalty": False}
    try:
        high = (
            supabase.table("economic_events")
            .select("id")
            .eq("currency", "USD")
            .eq("impact", "HIGH")
            .gte("event_date", high_start.isoformat())
            .lte("event_date", high_end.isoformat())
            .execute()
        )
        out["high_blackout"] = len(high.data or []) > 0
    except Exception:
        pass
    try:
        med = (
            supabase.table("economic_events")
            .select("id")
            .eq("currency", "USD")
            .eq("impact", "MEDIUM")
            .gte("event_date", med_start.isoformat())
            .lte("event_date", med_end.isoformat())
            .execute()
        )
        out["medium_penalty"] = len(med.data or []) > 0
    except Exception:
        pass
    return out


def get_or_create_daily_risk() -> dict:
    today = datetime.now(timezone.utc).date().isoformat()
    default = {"trade_date": today, "daily_loss_pct": 0.0, "consecutive_sl": 0, "cooldown_until": None, "halted_reason": None}
    try:
        resp = supabase.table("risk_guard_state").select("*").eq("trade_date", today).limit(1).execute()
        row = (resp.data or [None])[0]
        if row:
            return default | row
        supabase.table("risk_guard_state").upsert(default, on_conflict="trade_date").execute()
    except Exception:
        pass
    return default


def risk_allow(state: dict) -> tuple[bool, str]:
    if safe_float(state.get("daily_loss_pct"), 0) >= DAILY_MAX_LOSS_PCT:
        return False, "DAILY_LOSS_LIMIT"
    if int(state.get("consecutive_sl") or 0) >= MAX_CONSECUTIVE_SL:
        return False, "CONSECUTIVE_SL_LIMIT"
    cd = parse_dt(state.get("cooldown_until"))
    if cd and cd > datetime.now(timezone.utc):
        mins = int((cd - datetime.now(timezone.utc)).total_seconds() // 60)
        return False, f"DAILY_COOLDOWN_{max(mins, 1)}M"
    return True, "OK"


def update_daily_risk_from_close(row: dict, new_status: str) -> None:
    if new_status not in SIGNAL_STATUS_CLOSED:
        return
    state = get_or_create_daily_risk()
    risk_pct = safe_float(row.get("risk_percent_used"), 0.5)
    if new_status == "HIT_SL":
        state["daily_loss_pct"] = safe_float(state.get("daily_loss_pct"), 0) + max(risk_pct, 0.0)
        state["consecutive_sl"] = int(state.get("consecutive_sl") or 0) + 1
    elif new_status in ("HIT_TP1", "HIT_TP2", "HIT_TP3"):
        state["consecutive_sl"] = 0

    if safe_float(state.get("daily_loss_pct"), 0) >= DAILY_MAX_LOSS_PCT or int(state.get("consecutive_sl") or 0) >= MAX_CONSECUTIVE_SL:
        state["cooldown_until"] = (datetime.now(timezone.utc) + timedelta(minutes=DAILY_COOLDOWN_MINUTES)).isoformat()
        state["halted_reason"] = "daily_guard_triggered"

    try:
        supabase.table("risk_guard_state").upsert(state, on_conflict="trade_date").execute()
    except Exception:
        pass


def compute_position_size(balance: float, risk_percent: float, entry: float, sl: float) -> float:
    risk_amount = max(safe_float(balance, 0), 0) * max(safe_float(risk_percent, 0), 0) / 100.0
    stop_distance = max(abs(safe_float(entry, 0) - safe_float(sl, 0)), 0.0001)
    return risk_amount / stop_distance


def create_demo_trades_for_signal(signal_row: dict) -> None:
    signal_id = signal_row.get("id")
    if not signal_id:
        return
    if str(signal_row.get("status", "")).upper() != "ACTIVE":
        return

    try:
        accounts_resp = (
            supabase.table("demo_accounts")
            .select("user_id,balance,auto_trade_enabled,risk_model")
            .eq("auto_trade_enabled", True)
            .execute()
        )
        accounts = accounts_resp.data or []
    except Exception as e:
        print(f"  WARNING: demo account query failed: {e}")
        return

    if not accounts:
        return

    try:
        existing_resp = (
            supabase.table("demo_trades")
            .select("user_id")
            .eq("signal_id", signal_id)
            .execute()
        )
        existing_users = {row.get("user_id") for row in (existing_resp.data or []) if row.get("user_id")}
    except Exception:
        existing_users = set()

    entry = safe_float(signal_row.get("entry_price"), 0)
    sl = safe_float(signal_row.get("sl"), 0)
    tp1 = safe_float(signal_row.get("tp1"), 0)
    tp2 = safe_float(signal_row.get("tp2"), 0)
    tp3 = safe_float(signal_row.get("tp3"), 0)
    lane = str(signal_row.get("lane", "intraday"))
    side = str(signal_row.get("type", "BUY")).upper()
    signal_risk_pct = safe_float(signal_row.get("risk_percent_used"), 0.5)
    now_iso = datetime.now(timezone.utc).isoformat()

    created = 0
    for account in accounts:
        user_id = account.get("user_id")
        if not user_id or user_id in existing_users:
            continue

        risk_model = parse_json_object(account.get("risk_model"))
        risk_percent = safe_float(risk_model.get("risk_percent"), signal_risk_pct)
        if risk_percent <= 0:
            risk_percent = signal_risk_pct if signal_risk_pct > 0 else 0.5

        position_size = compute_position_size(
            balance=safe_float(account.get("balance"), 100000),
            risk_percent=risk_percent,
            entry=entry,
            sl=sl,
        )

        row = {
            "user_id": user_id,
            "signal_id": signal_id,
            "lane": lane,
            "side": side,
            "status": "OPEN",
            "entry": round(entry, 5),
            "sl": round(sl, 5),
            "tp1": round(tp1, 5),
            "tp2": round(tp2, 5),
            "tp3": round(tp3, 5),
            "opened_at": now_iso,
            "risk_percent_used": round(risk_percent, 4),
            "position_size": round(position_size, 6),
            "metadata": {"source": "signal_engine_v2"},
        }
        try:
            supabase.table("demo_trades").insert(row).execute()
            created += 1
        except Exception as e:
            print(f"  WARNING: demo trade insert failed for user {user_id}: {e}")

    if created > 0:
        print(f"  Demo trades opened: {created}")


def settle_demo_trades_for_signal(signal_row: dict, closed_status: str, current_price: float) -> None:
    if closed_status not in SIGNAL_STATUS_CLOSED:
        return

    signal_id = signal_row.get("id")
    if not signal_id:
        return

    try:
        open_resp = (
            supabase.table("demo_trades")
            .select("*")
            .eq("signal_id", signal_id)
            .eq("status", "OPEN")
            .execute()
        )
        open_trades = open_resp.data or []
    except Exception as e:
        print(f"  WARNING: open demo trade fetch failed: {e}")
        return

    if not open_trades:
        return

    close_price_map = {
        "HIT_TP1": safe_float(signal_row.get("tp1"), current_price),
        "HIT_TP2": safe_float(signal_row.get("tp2"), current_price),
        "HIT_TP3": safe_float(signal_row.get("tp3"), current_price),
        "HIT_SL": safe_float(signal_row.get("sl"), current_price),
        "EXPIRED": safe_float(current_price, safe_float(signal_row.get("entry_price"), 0)),
    }
    close_price = safe_float(close_price_map.get(closed_status), current_price)
    trade_status = "WIN" if closed_status in ("HIT_TP1", "HIT_TP2", "HIT_TP3") else ("LOSS" if closed_status == "HIT_SL" else "EXPIRED")
    now_iso = datetime.now(timezone.utc).isoformat()

    pnl_by_user: dict[str, float] = {}
    closed_count = 0
    for trade in open_trades:
        trade_id = trade.get("id")
        user_id = trade.get("user_id")
        side = str(trade.get("side", "BUY")).upper()
        entry = safe_float(trade.get("entry"), 0)
        sl = safe_float(trade.get("sl"), 0)
        position_size = safe_float(trade.get("position_size"), 0)
        stop_distance = max(abs(entry - sl), 0.0001)
        risk_amount = stop_distance * position_size

        if side == "SELL":
            pnl_usd = (entry - close_price) * position_size
            pnl_pips = (entry - close_price)
        else:
            pnl_usd = (close_price - entry) * position_size
            pnl_pips = (close_price - entry)

        pnl_r = pnl_usd / risk_amount if risk_amount > 0 else 0.0
        update_row = {
            "status": trade_status,
            "closed_at": now_iso,
            "close_price": round(close_price, 5),
            "close_reason": closed_status,
            "pnl_usd": round(pnl_usd, 6),
            "pnl_r": round(pnl_r, 6),
            "pnl_pips": round(pnl_pips, 6),
        }

        try:
            update_resp = (
                supabase.table("demo_trades")
                .update(update_row)
                .eq("id", trade_id)
                .eq("status", "OPEN")
                .select("id")
                .execute()
            )
            updated_rows = update_resp.data or []
            if updated_rows:
                closed_count += 1
                if user_id:
                    pnl_by_user[user_id] = safe_float(pnl_by_user.get(user_id), 0) + pnl_usd
        except Exception as e:
            print(f"  WARNING: demo trade close failed for {trade_id}: {e}")

    for user_id, user_pnl in pnl_by_user.items():
        try:
            account_resp = (
                supabase.table("demo_accounts")
                .select("user_id,balance,equity")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            account = (account_resp.data or [None])[0]
            if not account:
                continue
            new_balance = safe_float(account.get("balance"), 100000) + safe_float(user_pnl, 0)
            new_equity = new_balance
            (
                supabase.table("demo_accounts")
                .update({"balance": round(new_balance, 6), "equity": round(new_equity, 6)})
                .eq("user_id", user_id)
                .execute()
            )
            (
                supabase.table("demo_equity_points")
                .insert(
                    {
                        "user_id": user_id,
                        "ts": now_iso,
                        "balance": round(new_balance, 6),
                        "equity": round(new_equity, 6),
                    }
                )
                .execute()
            )
        except Exception as e:
            print(f"  WARNING: demo account settlement failed for user {user_id}: {e}")

    if closed_count > 0:
        print(f"  Demo trades settled: {closed_count} ({closed_status})")


def get_asian_range(df_m15: pd.DataFrame) -> dict | None:
    now = datetime.now(timezone.utc)
    day0 = now.replace(hour=0, minute=0, second=0, microsecond=0)
    bars = df_m15[(df_m15.index >= day0.replace(hour=ASIAN_SESSION_START_HOUR)) & (df_m15.index < day0.replace(hour=ASIAN_SESSION_END_HOUR))]
    if len(bars) < 2:
        return None
    return {"high": safe_float(bars["High"].max()), "low": safe_float(bars["Low"].min())}


def build_candidate(
    lane: LaneConfig,
    direction: str,
    trigger_df: pd.DataFrame,
    confirm_df: pd.DataFrame,
    session: dict,
    news: dict,
    spread_info: dict,
    asian_range: dict | None,
    threshold_adjust: int,
) -> dict:
    latest = trigger_df.iloc[-1]
    prev = trigger_df.iloc[-2] if len(trigger_df) > 1 else latest
    conf = confirm_df.iloc[-1]

    close = safe_float(latest.get("Close"), 0)
    atr = max(safe_float(latest.get("atr"), 0), max(close * 0.002, 0.1))
    adx = safe_float(conf.get("adx"), 0)
    conf_close = safe_float(conf.get("Close"), close)
    anchor = safe_float(conf.get("vwap"), 0) or safe_float(conf.get("sma50"), 0)

    k_now = safe_float(latest.get("stochrsi_k"), 50)
    d_now = safe_float(latest.get("stochrsi_d"), 50)
    k_prev = safe_float(prev.get("stochrsi_k"), 50)
    d_prev = safe_float(prev.get("stochrsi_d"), 50)
    macd_now = safe_float(latest.get("macd_histogram"), 0)
    macd_prev = safe_float(prev.get("macd_histogram"), 0)
    k_mid = safe_float(latest.get("keltner_mid"), close)
    k_up = safe_float(latest.get("keltner_upper"), close)
    k_low = safe_float(latest.get("keltner_lower"), close)

    trend_filter = adx >= 18 and ((direction == "BUY" and conf_close >= anchor) or (direction == "SELL" and conf_close <= anchor) or anchor == 0)
    if direction == "BUY":
        momentum = macd_now > macd_prev and macd_now >= 0 and k_now > d_now and k_now >= 20
        pullback = close >= k_mid or close <= (k_low + atr * 0.35)
    else:
        momentum = macd_now < macd_prev and macd_now <= 0 and k_now < d_now and k_now <= 80
        pullback = close <= k_mid or close >= (k_up - atr * 0.35)

    asian_breakout = False
    if lane.name == "intraday" and asian_range:
        asian_breakout = close > (asian_range["high"] + atr * 0.15) if direction == "BUY" else close < (asian_range["low"] - atr * 0.15)

    if session["is_asia"]:
        session_fit = asian_breakout or adx <= 18
    elif session["is_overlap"]:
        session_fit = trend_filter and momentum
    else:
        session_fit = trend_filter or momentum

    spread = spread_info.get("spread")
    spread_cap = max(0.35 if lane.name == "intraday" else 0.45, atr * 0.12)
    spread_ok = spread is None or safe_float(spread, 0) <= spread_cap
    volatility_ok = atr > 0 and spread_ok

    if lane.name == "intraday":
        weights = {
            "trend_structure": 20,
            "momentum": 20,
            "pullback_quality": 20,
            "volatility_spread": 15,
            "session_context": 15,
            "asian_range": 10,
        }
        breakdown = {
            "trend_structure": weights["trend_structure"] if trend_filter else 0,
            "momentum": weights["momentum"] if momentum else 0,
            "pullback_quality": weights["pullback_quality"] if pullback else 0,
            "volatility_spread": weights["volatility_spread"] if volatility_ok else 0,
            "session_context": weights["session_context"] if session_fit else 0,
            "asian_range": weights["asian_range"] if asian_breakout else 0,
        }
    else:
        weights = {
            "trend_structure": 22,
            "momentum": 22,
            "pullback_quality": 22,
            "volatility_spread": 17,
            "session_context": 17,
        }
        breakdown = {
            "trend_structure": weights["trend_structure"] if trend_filter else 0,
            "momentum": weights["momentum"] if momentum else 0,
            "pullback_quality": weights["pullback_quality"] if pullback else 0,
            "volatility_spread": weights["volatility_spread"] if volatility_ok else 0,
            "session_context": weights["session_context"] if session_fit else 0,
        }

    score_total = round(sum(breakdown.values()), 2)

    # Regime-aware + session-aware exit shaping.
    regime = "TREND" if adx >= 25 else ("RANGE" if adx <= 19 else "MIXED")
    if regime == "TREND":
        tp_mult = (1.20, 2.60, 4.00)
    elif regime == "RANGE":
        tp_mult = (0.80, 1.60, 2.40)
    else:
        tp_mult = (1.00, 2.00, 3.00)

    session_name = session.get("name", "OFF_HOURS")
    if session_name == "ASIA":
        session_stop_mult = 1.05
        session_tp_mult = 0.90
    elif session_name == "LONDON_NY_OVERLAP":
        session_stop_mult = 0.98
        session_tp_mult = 1.10
    else:
        session_stop_mult = 1.00
        session_tp_mult = 1.00

    atr_stop_dist = atr * lane.stop_multiplier * session_stop_mult

    # Structure stop distance from recent swing + small ATR buffer.
    swing_lookback = 8 if lane.name == "intraday" else 6
    trigger_tail = trigger_df.tail(swing_lookback)
    if direction == "BUY":
        recent_swing = safe_float(trigger_tail["Low"].min(), close)
        structure_stop_dist = max(close - recent_swing + (atr * 0.12), 0.0001)
    else:
        recent_swing = safe_float(trigger_tail["High"].max(), close)
        structure_stop_dist = max(recent_swing - close + (atr * 0.12), 0.0001)

    # Hybrid stop: choose the more conservative of ATR/structure, keep ATR-band validation.
    stop_dist = max(atr_stop_dist, structure_stop_dist)
    stop_floor = atr * (0.8 if lane.name == "intraday" else 1.0)
    stop_ceiling = atr * (2.8 if lane.name == "intraday" else 3.2)
    stop_band_ok = stop_floor <= stop_dist <= stop_ceiling

    if direction == "BUY":
        sl = close - stop_dist
        tp1 = close + (atr * tp_mult[0] * session_tp_mult)
        tp2 = close + (atr * tp_mult[1] * session_tp_mult)
        tp3 = close + (atr * tp_mult[2] * session_tp_mult)
    else:
        sl = close + stop_dist
        tp1 = close - (atr * tp_mult[0] * session_tp_mult)
        tp2 = close - (atr * tp_mult[1] * session_tp_mult)
        tp3 = close - (atr * tp_mult[2] * session_tp_mult)

    rr_tp2 = abs(tp2 - close) / max(abs(close - sl), 0.0001)
    rr_ok = rr_tp2 >= lane.min_rr_tp2

    blocked = None
    if news["high_blackout"]:
        blocked = "HIGH_IMPACT_BLACKOUT"
    elif not spread_ok:
        blocked = "SPREAD_TOO_WIDE"
    elif not rr_ok:
        blocked = "RR_BELOW_MIN"
    elif not stop_band_ok:
        blocked = "STOP_DISTANCE_OUT_OF_BAND"

    threshold = lane.threshold + threshold_adjust
    if blocked is None and score_total < threshold:
        blocked = "SCORE_BELOW_THRESHOLD"

    risk_amount = ACCOUNT_EQUITY_DEFAULT * (lane.risk_percent / 100.0)
    position_size = risk_amount / max(stop_dist, 0.0001)

    return {
        "lane": lane.name,
        "type": direction,
        "timeframe": lane.timeframe_label,
        "entry_price": round(close, 2),
        "tp1": round(tp1, 2),
        "tp2": round(tp2, 2),
        "tp3": round(tp3, 2),
        "sl": round(sl, 2),
        "adx_value": round(adx, 2),
        "atr_value": round(atr, 4),
        "rr_value": round(rr_tp2, 4),
        "risk_percent_used": lane.risk_percent,
        "position_size": round(position_size, 4),
        "score_total": score_total,
        "score_breakdown": breakdown,
        "blocked_reason": blocked,
        "threshold": threshold,
        "session_context": session["name"],
        "news_context": {"high_blackout": news["high_blackout"], "medium_penalty": news["medium_penalty"]},
        "hard_gates": {"spread_ok": spread_ok, "min_rr_ok": rr_ok, "stop_band_ok": stop_band_ok, "news_ok": not news["high_blackout"]},
        "conditions": {
            "trend_filter": bool(trend_filter),
            "momentum": bool(momentum),
            "pullback": bool(pullback),
            "asian_range": bool(asian_breakout),
            "volatility_spread": bool(volatility_ok),
            "macro_news": not news["high_blackout"],
            "session_fit": bool(session_fit),
        },
        "regime": regime,
        "session_name": session_name,
        "atr_stop_dist": round(atr_stop_dist, 5),
        "structure_stop_dist": round(structure_stop_dist, 5),
        "session_stop_mult": round(session_stop_mult, 4),
        "session_tp_mult": round(session_tp_mult, 4),
        "tp_mult": {"tp1": tp_mult[0], "tp2": tp_mult[1], "tp3": tp_mult[2]},
    }


def rolling_expectancy(limit: int = 50) -> float:
    try:
        resp = (
            supabase.table("signals")
            .select("status")
            .in_("status", list(SIGNAL_STATUS_CLOSED))
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = resp.data or []
    except Exception:
        return 0.0
    if not rows:
        return 0.0
    m = {"HIT_TP1": 1.0, "HIT_TP2": 2.0, "HIT_TP3": 3.0, "HIT_SL": -1.0, "EXPIRED": -0.2}
    vals = [m.get(r.get("status"), 0.0) for r in rows]
    return float(sum(vals) / max(len(vals), 1))


def rolling_lane_session_metrics(lane: str, session_name: str, limit: int = 120) -> dict:
    try:
        resp = (
            supabase.table("signals")
            .select("status,lane,session_context")
            .in_("status", list(SIGNAL_STATUS_CLOSED))
            .eq("lane", lane)
            .eq("session_context", session_name)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = resp.data or []
    except Exception:
        rows = []

    if not rows:
        return {"expectancy": 0.0, "drawdown_r": 0.0, "count": 0}

    m = {"HIT_TP1": 1.0, "HIT_TP2": 2.0, "HIT_TP3": 3.0, "HIT_SL": -1.0, "EXPIRED": -0.2}
    vals = [m.get(r.get("status"), 0.0) for r in rows]
    expectancy = float(sum(vals) / max(len(vals), 1))
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    for v in vals:
        equity += v
        peak = max(peak, equity)
        max_dd = max(max_dd, peak - equity)
    return {"expectancy": expectancy, "drawdown_r": max_dd, "count": len(vals)}


def check_active_signal() -> dict | None:
    try:
        resp = supabase.table("signals").select("*").eq("status", "ACTIVE").order("created_at", desc=True).limit(1).execute()
        return (resp.data or [None])[0]
    except Exception:
        return None


def manage_active_signal(active: dict, current_price: float) -> str:
    kind = active.get("type")
    status = active.get("status", "ACTIVE")
    tp1, tp2, tp3, sl = safe_float(active.get("tp1")), safe_float(active.get("tp2")), safe_float(active.get("tp3")), safe_float(active.get("sl"))
    entry = safe_float(active.get("entry_price"), 0)
    conditions_state = parse_json_object(active.get("conditions_met"))
    tp1_be_applied = bool(conditions_state.get("tp1_be_applied"))
    next_status = status
    update_payload: dict[str, Any] = {}
    if kind == "BUY":
        if current_price <= sl:
            next_status = "HIT_SL"
        elif current_price >= tp3:
            next_status = "HIT_TP3"
        elif current_price >= tp2 and status not in ("HIT_TP2", "HIT_TP3"):
            next_status = "HIT_TP2"
        elif current_price >= tp1 and not tp1_be_applied and entry > 0:
            update_payload["sl"] = round(entry, 5)
            conditions_state["tp1_be_applied"] = True
            conditions_state["tp1_be_at"] = datetime.now(timezone.utc).isoformat()
            update_payload["conditions_met"] = json.dumps(conditions_state)
    elif kind == "SELL":
        if current_price >= sl:
            next_status = "HIT_SL"
        elif current_price <= tp3:
            next_status = "HIT_TP3"
        elif current_price <= tp2 and status not in ("HIT_TP2", "HIT_TP3"):
            next_status = "HIT_TP2"
        elif current_price <= tp1 and not tp1_be_applied and entry > 0:
            update_payload["sl"] = round(entry, 5)
            conditions_state["tp1_be_applied"] = True
            conditions_state["tp1_be_at"] = datetime.now(timezone.utc).isoformat()
            update_payload["conditions_met"] = json.dumps(conditions_state)

    created = parse_dt(active.get("created_at"))
    if created and datetime.now(timezone.utc) - created > timedelta(hours=6) and next_status == "ACTIVE":
        next_status = "EXPIRED"

    if next_status != status or update_payload:
        try:
            payload = dict(update_payload)
            if next_status != status:
                payload["status"] = next_status
            supabase.table("signals").update(payload).eq("id", active.get("id")).execute()
            if next_status != status:
                update_daily_risk_from_close(active, next_status)
                settle_demo_trades_for_signal(active, next_status, current_price)
                print(f"  Active signal updated: {status} -> {next_status}")
            elif update_payload.get("sl") is not None:
                print(f"  TP1 management: moved SL to breakeven at {update_payload['sl']}")
        except Exception as e:
            print(f"  WARNING: active signal update failed: {e}")
    return next_status


def insert_signal(payload: dict) -> dict | None:
    try:
        resp = supabase.table("signals").insert(payload).execute()
        return (resp.data or [None])[0]
    except Exception as e:
        print(f"  WARNING: full insert failed, fallback old schema: {e}")
    fallback = {
        "type": payload.get("type"),
        "entry_price": payload.get("entry_price"),
        "tp1": payload.get("tp1"),
        "tp2": payload.get("tp2"),
        "tp3": payload.get("tp3"),
        "sl": payload.get("sl"),
        "status": payload.get("status"),
        "confidence": payload.get("confidence"),
        "conditions_met": payload.get("conditions_met"),
        "adx_value": payload.get("adx_value"),
        "atr_value": payload.get("atr_value"),
        "timeframe": payload.get("timeframe"),
    }
    try:
        resp = supabase.table("signals").insert(fallback).execute()
        return (resp.data or [None])[0]
    except Exception as e:
        print(f"  ERROR: fallback insert failed: {e}")
        return None


def send_telegram(signal: dict, reason: str) -> None:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    if signal.get("status") != "ACTIVE":
        return
    conditions_raw = signal.get("conditions_met")
    details = {}
    if isinstance(conditions_raw, str):
        try:
            details = json.loads(conditions_raw)
        except Exception:
            details = {}
    elif isinstance(conditions_raw, dict):
        details = conditions_raw

    score_breakdown = details.get("score_breakdown") if isinstance(details.get("score_breakdown"), dict) else {}
    hard_gates = details.get("hard_gates") if isinstance(details.get("hard_gates"), dict) else {}
    news_context = details.get("news_context") if isinstance(details.get("news_context"), dict) else {}
    session_context = details.get("session_context") or signal.get("session_context") or "--"

    trend_s = score_breakdown.get("trend_structure", "--")
    mom_s = score_breakdown.get("momentum", "--")
    pull_s = score_breakdown.get("pullback_quality", "--")
    vol_s = score_breakdown.get("volatility_spread", "--")
    sess_s = score_breakdown.get("session_context", "--")

    spread_g = "PASS" if hard_gates.get("spread_ok") else "BLOCKED"
    rr_g = "PASS" if hard_gates.get("min_rr_ok") else "BLOCKED"
    stop_g = "PASS" if hard_gates.get("stop_band_ok") else "BLOCKED"
    news_g = "PASS" if hard_gates.get("news_ok") else "BLOCKED"

    news_summary = "none"
    if news_context.get("high_blackout"):
        news_summary = "high blackout"
    elif news_context.get("medium_penalty"):
        news_summary = "medium penalty"

    txt = (
        f"{signal.get('type')} XAUUSD ({str(signal.get('lane', 'intraday')).upper()})\\n"
        f"Entry: {signal.get('entry_price')}\\n"
        f"TP1: {signal.get('tp1')} | TP2: {signal.get('tp2')} | TP3: {signal.get('tp3')}\\n"
        f"SL: {signal.get('sl')}\\n"
        f"Score: {signal.get('score_total')} | RR(TP2): {signal.get('rr_value')}\\n"
        f"Breakdown T/M/P/V/S: {trend_s}/{mom_s}/{pull_s}/{vol_s}/{sess_s}\\n"
        f"Gates spread/RR/stop/news: {spread_g}/{rr_g}/{stop_g}/{news_g}\\n"
        f"Session: {session_context} | News: {news_summary}\\n"
        f"Reason: {reason}"
    )
    try:
        HTTP.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": txt},
            timeout=15,
        )
    except Exception:
        pass


def run_signal_engine() -> None:
    print(f"\\n{'=' * 62}")
    print(f"Signal Engine v2 - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'=' * 62}")

    df_m15 = fetch_candles("XAU/USD", 15, "minute")
    df_h1 = fetch_candles("XAU/USD", 1, "hour")
    df_h4 = fetch_candles("XAU/USD", 4, "hour")
    if df_m15 is None or df_h1 is None or df_h4 is None:
        print("  ERROR: missing candle set")
        return
    if len(df_m15) < 120 or len(df_h1) < 120 or len(df_h4) < 120:
        print("  ERROR: insufficient bars")
        return

    df_m15 = calculate_trigger_indicators(df_m15)
    df_h1 = calculate_trigger_indicators(df_h1)
    df_h4 = calculate_trigger_indicators(df_h4)
    df_h1 = calculate_confirm_indicators(df_h1)
    df_h4 = calculate_confirm_indicators(df_h4)

    current_price = safe_float(df_m15.iloc[-1]["Close"], 0)
    spread_info = fetch_latest_spread()
    dxy = fetch_dxy_quote()
    session = get_session_context()
    news = get_news_context()
    asian_range = get_asian_range(df_m15)
    exp50 = rolling_expectancy(50)
    state = get_or_create_daily_risk()
    allow, allow_reason = risk_allow(state)

    print(f"  Price: {current_price:.2f} | Spread: {spread_info.get('spread')} | Session: {session['name']}")
    print(f"  News(high={news['high_blackout']}, medium={news['medium_penalty']}) | Expectancy50={exp50:.3f} | Adaptive exits ON")

    active = check_active_signal()
    if active:
        manage_active_signal(active, current_price)

    candidates = []
    degrade_mode_active = False
    for lane in LANES.values():
        trigger_df = df_m15 if lane.name == "intraday" else df_h1
        confirm_df = df_h1 if lane.name == "intraday" else df_h4
        lane_session_metrics = rolling_lane_session_metrics(lane.name, session["name"], 120)
        threshold_adjust = 0
        if lane_session_metrics["count"] >= 20:
            if lane_session_metrics["expectancy"] < 0:
                threshold_adjust += 5
            if lane_session_metrics["drawdown_r"] > 3.0:
                threshold_adjust += 3
        if threshold_adjust > 0:
            degrade_mode_active = True
        for direction in ("BUY", "SELL"):
            candidates.append(
                build_candidate(
                    lane=lane,
                    direction=direction,
                    trigger_df=trigger_df,
                    confirm_df=confirm_df,
                    session=session,
                    news=news,
                    spread_info=spread_info,
                    asian_range=asian_range,
                    threshold_adjust=threshold_adjust,
                )
            )

    candidates.sort(key=lambda x: x["score_total"], reverse=True)
    best = candidates[0] if candidates else None
    reason = "NO_CANDIDATE"
    selected = None

    if best:
        if active:
            best["blocked_reason"] = "ACTIVE_SIGNAL_EXISTS"
            reason = "ACTIVE_SIGNAL_EXISTS"
        elif not allow:
            best["blocked_reason"] = allow_reason
            reason = allow_reason
        elif best["blocked_reason"] is None:
            selected = best
            reason = "PASSED_ALL_GATES"
        else:
            reason = best["blocked_reason"]

    if best:
        print(json.dumps({"best": {"lane": best["lane"], "type": best["type"], "score": best["score_total"], "blocked_reason": best["blocked_reason"]}, "reason": reason}, indent=2))

    def payload_from(candidate: dict, status: str, why: str) -> dict:
        score_raw = safe_float(candidate["score_total"], 0.0)
        score_normalized = max(0.0, min(100.0, score_raw))
        threshold_raw = safe_float(candidate.get("threshold"), 0.0)
        threshold_normalized = max(0.0, min(100.0, threshold_raw))
        confidence = int(round(score_normalized))
        return {
            "type": candidate["type"],
            "entry_price": candidate["entry_price"],
            "tp1": candidate["tp1"],
            "tp2": candidate["tp2"],
            "tp3": candidate["tp3"],
            "sl": candidate["sl"],
            "status": status,
            "confidence": confidence,
            "conditions_met": json.dumps({
                **candidate["conditions"],
                "hard_gates": candidate["hard_gates"],
                "score_total": score_normalized,
                "score_total_raw": score_raw,
                "threshold_raw": threshold_raw,
                "threshold_normalized": round(threshold_normalized, 2),
                "score_breakdown": candidate["score_breakdown"],
                "decision_reason": why,
                "session_context": candidate["session_context"],
                "news_context": candidate["news_context"],
                "blocked_reason": candidate["blocked_reason"],
                "tp1_be_applied": False,
                "adaptive_exits": {
                    "regime": candidate.get("regime"),
                    "session": candidate.get("session_name"),
                    "atr_stop_dist": candidate.get("atr_stop_dist"),
                    "structure_stop_dist": candidate.get("structure_stop_dist"),
                    "session_stop_mult": candidate.get("session_stop_mult"),
                    "session_tp_mult": candidate.get("session_tp_mult"),
                    "tp_mult": candidate.get("tp_mult"),
                },
            }),
            "adx_value": candidate["adx_value"],
            "atr_value": candidate["atr_value"],
            "timeframe": candidate["timeframe"],
            "lane": candidate["lane"],
            "score_total": round(score_normalized, 2),
            "score_breakdown": json.dumps(candidate["score_breakdown"]),
            "blocked_reason": None if status == "ACTIVE" else (candidate["blocked_reason"] or why),
            "rr_value": candidate["rr_value"],
            "risk_percent_used": candidate["risk_percent_used"],
            "position_size": candidate["position_size"],
            "session_context": candidate["session_context"],
            "news_context": json.dumps(candidate["news_context"]),
            "risk_context": json.dumps({
                "daily_loss_pct": safe_float(state.get("daily_loss_pct"), 0.0),
                "consecutive_sl": int(state.get("consecutive_sl") or 0),
                "degrade_mode": degrade_mode_active,
            }),
        }

    if selected:
        payload = payload_from(selected, "ACTIVE", reason)
        inserted = insert_signal(payload)
        if inserted:
            print(f"  Signal stored: {selected['type']} {selected['lane'].upper()} | score={selected['score_total']}")
            create_demo_trades_for_signal(inserted | {"status": "ACTIVE"})
            send_telegram(payload, reason)
    elif best:
        payload = payload_from(best, SIGNAL_STATUS_REJECTED, reason)
        insert_signal(payload)
        print(f"  Rejected candidate logged: {payload.get('blocked_reason')}")
    else:
        print("  No candidate produced this cycle")

    # Snapshot write (still useful for UI)
    try:
        s = {
            "adx": safe_float(df_h1.iloc[-1].get("adx"), 0),
            "vwap": safe_float(df_h1.iloc[-1].get("vwap"), 0),
            "stochrsi_k": safe_float(df_m15.iloc[-1].get("stochrsi_k"), 0),
            "stochrsi_d": safe_float(df_m15.iloc[-1].get("stochrsi_d"), 0),
            "macd_histogram": safe_float(df_m15.iloc[-1].get("macd_histogram"), 0),
            "keltner_upper": safe_float(df_m15.iloc[-1].get("keltner_upper"), 0),
            "keltner_lower": safe_float(df_m15.iloc[-1].get("keltner_lower"), 0),
            "atr": safe_float(df_m15.iloc[-1].get("atr"), 0),
            "dxy_price": safe_float((dxy or {}).get("price"), 0),
            "dxy_direction": "UP" if safe_float((dxy or {}).get("price"), 0) > 104 else ("DOWN" if safe_float((dxy or {}).get("price"), 0) > 0 else "FLAT"),
        }
        supabase.table("indicator_snapshots").insert(s).execute()
    except Exception as e:
        print(f"  WARNING: snapshot insert failed: {e}")

    print(f"{'=' * 62}")
    print("Signal engine run complete")
    print(f"{'=' * 62}")


if __name__ == "__main__":
    run_signal_engine()
