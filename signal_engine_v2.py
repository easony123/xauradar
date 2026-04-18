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
XAU_PIP_SIZE = max(float(os.getenv("XAU_PIP_SIZE", "0.1")), 1e-9)
REQUESTS_TRUST_ENV = os.getenv("REQUESTS_TRUST_ENV", "false").strip().lower() in ("1", "true", "yes", "on")
if not REQUESTS_TRUST_ENV:
    for _proxy_key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        os.environ.pop(_proxy_key, None)

HTTP = requests.Session()
HTTP.trust_env = REQUESTS_TRUST_ENV

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SIGNAL_STATUS_CLOSED = ("HIT_TP1", "HIT_TP2", "HIT_TP3", "HIT_SL", "BREAKEVEN", "EXPIRED")
SIGNAL_STATUS_REJECTED = "REJECTED"
DEMO_TP1_CLOSE_FRACTION = min(max(float(os.getenv("DEMO_TP1_CLOSE_FRACTION", "0.40")), 0.05), 0.95)
LANE_ORDER = ("intraday", "swing")

TELEGRAM_EVENT_LABELS = {
    "NEW_SIGNAL": "New active signal",
    "TP1": "TP1 hit",
    "TP2": "TP2 hit",
    "TP3": "TP3 hit",
    "STOP_LOSS": "Stop loss hit",
    "BREAKEVEN": "Breakeven exit",
    "EXPIRED": "Signal expired",
}

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
MARKET_REOPEN_SUNDAY_UTC_HOUR = 22
MARKET_CLOSE_FRIDAY_UTC_HOUR = 22


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
        stop_multiplier=1.35,
        min_rr_tp2=2.0,
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
        stop_multiplier=1.60,
        min_rr_tp2=2.0,
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


def _dump_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _candidate_ui_payload(candidate: dict | None, decision_state: str, reason: str, signal_id: str | None = None, created_at: str | None = None) -> dict:
    if not candidate:
        return {
            "lane": "",
            "type": "WAIT",
            "status": SIGNAL_STATUS_REJECTED,
            "decision_state": decision_state,
            "reason": reason,
            "blocked_reason": reason,
            "created_at": created_at or datetime.now(timezone.utc).isoformat(),
        }

    score_raw = safe_float(candidate.get("score_total"), 0.0)
    score_normalized = max(0.0, min(100.0, score_raw))
    threshold_raw = safe_float(candidate.get("threshold"), 0.0)
    threshold_normalized = max(0.0, min(100.0, threshold_raw))
    confidence = int(round(score_normalized))
    conditions = {
        **candidate.get("conditions", {}),
        "hard_gates": candidate.get("hard_gates", {}),
        "score_total": score_normalized,
        "score_total_raw": score_raw,
        "threshold_raw": threshold_raw,
        "threshold_normalized": round(threshold_normalized, 2),
        "score_breakdown": candidate.get("score_breakdown", {}),
        "decision_reason": reason,
        "session_context": candidate.get("session_context"),
        "news_context": candidate.get("news_context", {}),
        "blocked_reason": candidate.get("blocked_reason"),
        "tp1_be_applied": False,
        "adaptive_exits": {
            "regime": candidate.get("regime"),
            "session": candidate.get("session_name"),
            "atr_stop_dist": candidate.get("atr_stop_dist"),
            "structure_stop_dist": candidate.get("structure_stop_dist"),
            "structure_stop_used": candidate.get("structure_stop_used"),
            "session_stop_mult": candidate.get("session_stop_mult"),
            "session_tp_mult": candidate.get("session_tp_mult"),
            "tp_mult": candidate.get("tp_mult"),
        },
    }
    return {
        "signal_id": signal_id,
        "lane": candidate.get("lane"),
        "type": candidate.get("type"),
        "status": "ACTIVE" if decision_state == "ACTIVE" else SIGNAL_STATUS_REJECTED,
        "decision_state": decision_state,
        "reason": reason,
        "created_at": created_at or datetime.now(timezone.utc).isoformat(),
        "entry_price": candidate.get("entry_price"),
        "tp1": candidate.get("tp1"),
        "tp2": candidate.get("tp2"),
        "tp3": candidate.get("tp3"),
        "sl": candidate.get("sl"),
        "confidence": confidence,
        "score_total": round(score_normalized, 2),
        "score_breakdown": candidate.get("score_breakdown", {}),
        "blocked_reason": None if decision_state == "ACTIVE" else (candidate.get("blocked_reason") or reason),
        "rr_value": candidate.get("rr_value"),
        "risk_percent_used": candidate.get("risk_percent_used"),
        "position_size": candidate.get("position_size"),
        "session_context": candidate.get("session_context"),
        "news_context": candidate.get("news_context", {}),
        "risk_context": {},
        "adx_value": candidate.get("adx_value"),
        "atr_value": candidate.get("atr_value"),
        "timeframe": candidate.get("timeframe"),
        "h1_regime": candidate.get("regime"),
        "conditions_met": conditions,
    }


def _signal_ui_payload(signal_row: dict | None, decision_state: str, reason: str | None = None) -> dict:
    if not signal_row:
        return {
            "lane": "",
            "type": "WAIT",
            "status": SIGNAL_STATUS_REJECTED,
            "decision_state": decision_state,
            "reason": reason or decision_state,
            "blocked_reason": reason or decision_state,
        }

    conditions = parse_json_object(signal_row.get("conditions_met"))
    return {
        "signal_id": signal_row.get("id"),
        "id": signal_row.get("id"),
        "lane": signal_row.get("lane", "intraday"),
        "type": signal_row.get("type"),
        "status": signal_row.get("status"),
        "decision_state": decision_state,
        "reason": reason or signal_row.get("status"),
        "created_at": signal_row.get("created_at"),
        "entry_price": safe_float(signal_row.get("entry_price"), 0),
        "tp1": safe_float(signal_row.get("tp1"), 0),
        "tp2": safe_float(signal_row.get("tp2"), 0),
        "tp3": safe_float(signal_row.get("tp3"), 0),
        "sl": safe_float(signal_row.get("sl"), 0),
        "confidence": safe_float(signal_row.get("confidence"), 0),
        "score_total": safe_float(signal_row.get("score_total"), safe_float(conditions.get("score_total"), 0)),
        "score_breakdown": parse_json_object(signal_row.get("score_breakdown")),
        "blocked_reason": signal_row.get("blocked_reason"),
        "rr_value": safe_float(signal_row.get("rr_value"), 0),
        "risk_percent_used": safe_float(signal_row.get("risk_percent_used"), 0),
        "position_size": safe_float(signal_row.get("position_size"), 0),
        "session_context": signal_row.get("session_context"),
        "news_context": parse_json_object(signal_row.get("news_context")),
        "risk_context": parse_json_object(signal_row.get("risk_context")),
        "adx_value": safe_float(signal_row.get("adx_value"), 0),
        "atr_value": safe_float(signal_row.get("atr_value"), 0),
        "timeframe": signal_row.get("timeframe"),
        "h1_regime": conditions.get("adaptive_exits", {}).get("regime"),
        "conditions_met": conditions,
    }


def _decision_state_for_candidate(candidate: dict | None) -> str:
    if not candidate:
        return "NOT_READY"
    blocked_reason = str(candidate.get("blocked_reason") or "").upper()
    if not blocked_reason:
        return "READY"
    if blocked_reason in {"SCORE_BELOW_THRESHOLD", "NO_CANDIDATE"}:
        return "NOT_READY"
    return "BLOCKED"


def check_active_signals_by_lane() -> dict[str, dict]:
    try:
        resp = supabase.table("signals").select("*").eq("status", "ACTIVE").order("created_at", desc=True).execute()
        rows = resp.data or []
    except Exception:
        return {}

    active_by_lane: dict[str, dict] = {}
    for row in rows:
        lane = str(row.get("lane") or "intraday").lower()
        if lane not in active_by_lane:
            active_by_lane[lane] = row
    return active_by_lane


def insert_decision_run(market_price: float, lane_payloads: dict[str, dict], meta: dict | None = None) -> None:
    row = {
        "market_price": round(safe_float(market_price, 0), 5),
        "intraday_decision": lane_payloads.get("intraday", {}),
        "swing_decision": lane_payloads.get("swing", {}),
        "meta": meta or {},
    }
    try:
        supabase.table("signal_decision_runs").insert(row).execute()
    except Exception as e:
        print(f"  WARNING: signal decision run insert failed: {e}")


def _notification_sent(signal_id: str | None, event_type: str) -> bool:
    if not signal_id:
        return False
    try:
        resp = (
            supabase.table("signal_notifications")
            .select("id")
            .eq("signal_id", signal_id)
            .eq("event_type", event_type)
            .limit(1)
            .execute()
        )
        return bool(resp.data)
    except Exception:
        return False


def _record_notification(signal_id: str | None, lane: str, event_type: str, payload_hash: str, meta: dict | None = None) -> None:
    if not signal_id:
        return
    try:
        supabase.table("signal_notifications").insert(
            {
                "signal_id": signal_id,
                "lane": lane,
                "event_type": event_type,
                "payload_hash": payload_hash,
                "meta": meta or {},
            }
        ).execute()
    except Exception as e:
        print(f"  WARNING: signal notification record failed: {e}")


def notify_signal_event(signal: dict, event_type: str, reason: str, event_price: float | None = None, meta: dict | None = None) -> None:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return

    signal_id = signal.get("id") or signal.get("signal_id")
    lane = str(signal.get("lane") or "intraday").upper()
    side = str(signal.get("type") or "WAIT").upper()
    if not signal_id or _notification_sent(signal_id, event_type):
        return

    conditions = signal.get("conditions_met")
    if not isinstance(conditions, dict):
        conditions = parse_json_object(conditions)
    adaptive = conditions.get("adaptive_exits") if isinstance(conditions.get("adaptive_exits"), dict) else {}

    text = (
        f"{TELEGRAM_EVENT_LABELS.get(event_type, event_type)} | XAUUSD {lane}\n"
        f"Side: {side}\n"
        f"Entry: {signal.get('entry_price')} | TP1: {signal.get('tp1')} | TP2: {signal.get('tp2')} | TP3: {signal.get('tp3')} | SL: {signal.get('sl')}\n"
        f"Score: {signal.get('score_total')} | Confidence: {signal.get('confidence')} | RR(TP2): {signal.get('rr_value')}\n"
        f"Session: {signal.get('session_context') or '--'} | Regime: {adaptive.get('regime') or signal.get('h1_regime') or '--'}\n"
        f"Event price: {round(safe_float(event_price, safe_float(signal.get('entry_price'), 0)), 5)}\n"
        f"Reason: {reason}"
    )

    try:
        resp = HTTP.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text},
            timeout=15,
        )
        if resp.ok:
            _record_notification(
                signal_id=signal_id,
                lane=str(signal.get("lane") or "intraday"),
                event_type=event_type,
                payload_hash=f"{signal_id}:{event_type}:{reason}",
                meta={"reason": reason, **(meta or {})},
            )
    except Exception:
        pass


def record_demo_trade_event(
    trade_id: str | None,
    signal_id: str | None,
    user_id: str | None,
    lane: str,
    event_type: str,
    event_price: float,
    realized_size: float,
    remaining_size: float,
    pnl_usd: float,
    pnl_r: float,
    pnl_pips: float,
    meta: dict | None = None,
) -> None:
    if not trade_id or not user_id:
        return
    try:
        supabase.table("demo_trade_events").insert(
            {
                "trade_id": trade_id,
                "signal_id": signal_id,
                "user_id": user_id,
                "lane": lane,
                "event_type": event_type,
                "event_price": round(safe_float(event_price, 0), 5),
                "realized_size": round(safe_float(realized_size, 0), 6),
                "remaining_size": round(safe_float(remaining_size, 0), 6),
                "pnl_usd": round(safe_float(pnl_usd, 0), 6),
                "pnl_r": round(safe_float(pnl_r, 0), 6),
                "pnl_pips": round(safe_float(pnl_pips, 0), 6),
                "meta": meta or {},
            }
        ).execute()
    except Exception as e:
        print(f"  WARNING: demo trade event insert failed for {trade_id}: {e}")


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


def get_market_clock_context(now: datetime | None = None) -> dict:
    current = now or datetime.now(timezone.utc)
    weekday = current.weekday()
    total_minutes = current.hour * 60 + current.minute
    reopen_minutes = MARKET_REOPEN_SUNDAY_UTC_HOUR * 60
    friday_close_minutes = MARKET_CLOSE_FRIDAY_UTC_HOUR * 60

    market_open = True
    reason = "OPEN"
    if weekday == 5:
        market_open = False
        reason = "SATURDAY_CLOSED"
    elif weekday == 6 and total_minutes < reopen_minutes:
        market_open = False
        reason = "SUNDAY_PREOPEN"
    elif weekday == 4 and total_minutes >= friday_close_minutes:
        market_open = False
        reason = "FRIDAY_AFTER_CLOSE"

    return {
        "market_open": market_open,
        "reason": reason,
        "weekday": weekday,
        "utc_hour": current.hour,
        "utc_minute": current.minute,
    }


def get_session_context() -> dict:
    now = datetime.now(timezone.utc)
    market_clock = get_market_clock_context(now)
    if not market_clock["market_open"]:
        return {"name": "MARKET_CLOSED", "is_asia": False, "is_overlap": False, "market_open": False}

    h = now.hour
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
    return {"name": name, "is_asia": is_asia, "is_overlap": is_overlap, "market_open": True}


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


def _trade_price_move(side: str, entry: float, close_price: float) -> float:
    return (entry - close_price) if str(side).upper() == "SELL" else (close_price - entry)


def _load_trade_state(trade: dict, signal_row: dict) -> tuple[dict, float, float, float]:
    metadata = parse_json_object(trade.get("metadata"))
    if not isinstance(metadata, dict):
        metadata = {}

    entry = safe_float(trade.get("entry"), safe_float(signal_row.get("entry_price"), 0))
    orig_sl = safe_float(metadata.get("orig_sl"), safe_float(trade.get("sl"), safe_float(signal_row.get("sl"), 0)))
    initial_size = safe_float(metadata.get("initial_position_size"), safe_float(trade.get("position_size"), 0))
    remaining_size = safe_float(metadata.get("remaining_position_size"), safe_float(trade.get("position_size"), 0))

    if initial_size <= 0:
        initial_size = max(remaining_size, 0.0)
    if remaining_size <= 0:
        remaining_size = max(initial_size, 0.0)

    metadata.setdefault("orig_sl", round(orig_sl, 6))
    metadata.setdefault("initial_position_size", round(initial_size, 6))
    metadata.setdefault("remaining_position_size", round(remaining_size, 6))
    metadata.setdefault("tp1_fraction", DEMO_TP1_CLOSE_FRACTION)
    metadata.setdefault("tp1_partial_done", False)
    metadata.setdefault("realized_pnl_usd", 0.0)
    metadata.setdefault("realized_pnl_r", 0.0)
    metadata.setdefault("realized_pnl_pips", 0.0)
    metadata.setdefault("partial_fills", [])
    return metadata, entry, initial_size, remaining_size


def _apply_account_pnl_deltas(pnl_by_user: dict[str, float], now_iso: str) -> None:
    for user_id, user_pnl in pnl_by_user.items():
        if not user_id or abs(user_pnl) < 1e-12:
            continue
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


def apply_demo_tp1_partial(signal_row: dict, tp1_price: float, now_iso: str | None = None) -> int:
    signal_id = signal_row.get("id")
    if not signal_id:
        return 0

    now_iso = now_iso or datetime.now(timezone.utc).isoformat()
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
        print(f"  WARNING: open demo trades fetch failed for TP1 partial: {e}")
        return 0

    pnl_by_user: dict[str, float] = {}
    partial_count = 0
    for trade in open_trades:
        trade_id = trade.get("id")
        user_id = trade.get("user_id")
        side = str(trade.get("side", "BUY")).upper()
        metadata, entry, initial_size, remaining_size = _load_trade_state(trade, signal_row)
        if bool(metadata.get("tp1_partial_done")):
            continue
        if initial_size <= 0 or remaining_size <= 0:
            continue

        tp1_fraction = min(max(safe_float(metadata.get("tp1_fraction"), DEMO_TP1_CLOSE_FRACTION), 0.05), 0.95)
        partial_size = min(remaining_size, initial_size * tp1_fraction)
        if partial_size <= 0:
            continue

        orig_sl = safe_float(metadata.get("orig_sl"), safe_float(trade.get("sl"), safe_float(signal_row.get("sl"), 0)))
        risk_amount_total = max(abs(entry - orig_sl) * initial_size, 1e-9)
        price_move = _trade_price_move(side, entry, tp1_price)
        pnl_usd_partial = price_move * partial_size
        pnl_r_partial = pnl_usd_partial / risk_amount_total
        pnl_pips_partial = (price_move / XAU_PIP_SIZE) * (partial_size / max(initial_size, 1e-9))

        remaining_after = max(remaining_size - partial_size, 0.0)
        metadata["tp1_partial_done"] = True
        metadata["tp1_partial_at"] = now_iso
        metadata["remaining_position_size"] = round(remaining_after, 6)
        metadata["realized_pnl_usd"] = round(safe_float(metadata.get("realized_pnl_usd"), 0) + pnl_usd_partial, 6)
        metadata["realized_pnl_r"] = round(safe_float(metadata.get("realized_pnl_r"), 0) + pnl_r_partial, 6)
        metadata["realized_pnl_pips"] = round(safe_float(metadata.get("realized_pnl_pips"), 0) + pnl_pips_partial, 6)
        fills = metadata.get("partial_fills")
        if not isinstance(fills, list):
            fills = []
        fills.append(
            {
                "at": now_iso,
                "reason": "TP1_PARTIAL",
                "price": round(tp1_price, 5),
                "size": round(partial_size, 6),
                "pnl_usd": round(pnl_usd_partial, 6),
                "pnl_r": round(pnl_r_partial, 6),
            }
        )
        metadata["partial_fills"] = fills

        update_payload = {
            "position_size": round(remaining_after, 6),
            "sl": round(safe_float(signal_row.get("sl"), entry), 5),
            "metadata": metadata,
        }
        try:
            updated = (
                supabase.table("demo_trades")
                .update(update_payload)
                .eq("id", trade_id)
                .eq("status", "OPEN")
                .select("id")
                .execute()
            )
            if updated.data:
                partial_count += 1
                if user_id:
                    pnl_by_user[user_id] = safe_float(pnl_by_user.get(user_id), 0) + pnl_usd_partial
                record_demo_trade_event(
                    trade_id=trade_id,
                    signal_id=signal_id,
                    user_id=user_id,
                    lane=str(signal_row.get("lane", trade.get("lane", "intraday"))),
                    event_type="TP1_PARTIAL",
                    event_price=tp1_price,
                    realized_size=partial_size,
                    remaining_size=remaining_after,
                    pnl_usd=pnl_usd_partial,
                    pnl_r=pnl_r_partial,
                    pnl_pips=pnl_pips_partial,
                    meta={"fraction": tp1_fraction},
                )
                record_demo_trade_event(
                    trade_id=trade_id,
                    signal_id=signal_id,
                    user_id=user_id,
                    lane=str(signal_row.get("lane", trade.get("lane", "intraday"))),
                    event_type="SL_TO_BREAKEVEN",
                    event_price=safe_float(signal_row.get("sl"), entry),
                    realized_size=0.0,
                    remaining_size=remaining_after,
                    pnl_usd=0.0,
                    pnl_r=0.0,
                    pnl_pips=0.0,
                    meta={"new_sl": round(safe_float(signal_row.get("sl"), entry), 5)},
                )
        except Exception as e:
            print(f"  WARNING: demo TP1 partial update failed for {trade_id}: {e}")

    if pnl_by_user:
        _apply_account_pnl_deltas(pnl_by_user, now_iso)
    return partial_count


def create_demo_trades_for_signal(signal_row: dict) -> None:
    signal_id = signal_row.get("id")
    if not signal_id:
        print("  Demo trade sync skipped: signal row missing id.")
        return
    if str(signal_row.get("status", "")).upper() != "ACTIVE":
        print(f"  Demo trade sync skipped: signal {signal_id} status is {signal_row.get('status')}.")
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
        print(f"  WARNING: demo account query failed for signal {signal_id}: {type(e).__name__}: {e}")
        return

    print(f"  Demo auto-trade accounts eligible for {signal_id}: {len(accounts)}")
    if not accounts:
        print(f"  Demo trade sync skipped: no eligible demo accounts for signal {signal_id}.")
        return

    try:
        existing_resp = (
            supabase.table("demo_trades")
            .select("user_id")
            .eq("signal_id", signal_id)
            .execute()
        )
        existing_users = {row.get("user_id") for row in (existing_resp.data or []) if row.get("user_id")}
        print(f"  Existing demo trade users for {signal_id}: {len(existing_users)}")
    except Exception as e:
        print(f"  WARNING: existing demo trade lookup failed for signal {signal_id}: {type(e).__name__}: {e}")
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

    if entry <= 0 or sl <= 0:
        print(f"  WARNING: demo trade sync skipped for {signal_id}: invalid entry/sl ({entry}, {sl})")
        return

    created = 0
    for account in accounts:
        user_id = account.get("user_id")
        if not user_id:
            print(f"  WARNING: demo account row missing user_id for signal {signal_id}.")
            continue
        if user_id in existing_users:
            print(f"  Demo trade already exists for user {user_id} signal {signal_id}")
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
            "metadata": {
                "source": "signal_engine_v2",
                "orig_sl": round(sl, 6),
                "initial_position_size": round(position_size, 6),
                "remaining_position_size": round(position_size, 6),
                "tp1_fraction": DEMO_TP1_CLOSE_FRACTION,
                "tp1_partial_done": False,
                "realized_pnl_usd": 0.0,
                "realized_pnl_r": 0.0,
                "realized_pnl_pips": 0.0,
                "partial_fills": [],
            },
        }
        print(f"  Demo trade payload for user {user_id}: {_dump_json(row)}")
        try:
            insert_resp = supabase.table("demo_trades").insert(row).select("id").execute()
            inserted_trade = (insert_resp.data or [None])[0] if insert_resp else None
            created += 1
            record_demo_trade_event(
                trade_id=(inserted_trade or {}).get("id"),
                signal_id=signal_id,
                user_id=user_id,
                lane=lane,
                event_type="OPEN",
                event_price=entry,
                realized_size=0.0,
                remaining_size=position_size,
                pnl_usd=0.0,
                pnl_r=0.0,
                pnl_pips=0.0,
                meta={"side": side},
            )
        except Exception as e:
            print(f"  WARNING: demo trade insert failed for user {user_id}: {type(e).__name__}: {e}")
            print(f"  Failed payload for user {user_id}: {_dump_json(row)}")

    if created > 0:
        print(f"  Demo trades opened: {created}")
    else:
        print(f"  Demo trade sync complete: no new demo trades created for signal {signal_id}.")


def sync_demo_trades_for_active_signals(active_by_lane: dict[str, dict]) -> None:
    for lane_name, active_signal in active_by_lane.items():
        if str(active_signal.get("status", "")).upper() != "ACTIVE":
            continue
        print(f"  Demo backfill check for active lane {lane_name} signal {active_signal.get('id')}")
        create_demo_trades_for_signal(active_signal)


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
        "BREAKEVEN": safe_float(signal_row.get("sl"), safe_float(signal_row.get("entry_price"), current_price)),
        "EXPIRED": safe_float(current_price, safe_float(signal_row.get("entry_price"), 0)),
    }
    close_price = safe_float(close_price_map.get(closed_status), current_price)
    if closed_status in ("HIT_TP1", "HIT_TP2", "HIT_TP3"):
        trade_status = "WIN"
    elif closed_status == "HIT_SL":
        trade_status = "LOSS"
    elif closed_status == "BREAKEVEN":
        trade_status = "BREAKEVEN"
    else:
        trade_status = "EXPIRED"
    now_iso = datetime.now(timezone.utc).isoformat()

    # If TP2/TP3 is reached directly, realize TP1 partial first for realism.
    if closed_status in ("HIT_TP2", "HIT_TP3"):
        try:
            tp1_price = safe_float(signal_row.get("tp1"), close_price)
            partial_count = apply_demo_tp1_partial(signal_row, tp1_price, now_iso=now_iso)
            if partial_count > 0:
                print(f"  Demo TP1 partial fills: {partial_count}")
                try:
                    refresh_resp = (
                        supabase.table("demo_trades")
                        .select("*")
                        .eq("signal_id", signal_id)
                        .eq("status", "OPEN")
                        .execute()
                    )
                    open_trades = refresh_resp.data or []
                except Exception as refresh_err:
                    print(f"  WARNING: post-TP1 refresh failed, skipping final settlement this run: {refresh_err}")
                    return
        except Exception as e:
            print(f"  WARNING: pre-close TP1 partial processing failed: {e}")

    pnl_by_user_final: dict[str, float] = {}
    closed_count = 0
    for trade in open_trades:
        trade_id = trade.get("id")
        user_id = trade.get("user_id")
        side = str(trade.get("side", "BUY")).upper()
        metadata, entry, initial_size, remaining_size = _load_trade_state(trade, signal_row)
        if initial_size <= 0:
            continue

        realized_pnl_usd = safe_float(metadata.get("realized_pnl_usd"), 0)
        realized_pnl_r = safe_float(metadata.get("realized_pnl_r"), 0)
        realized_pnl_pips = safe_float(metadata.get("realized_pnl_pips"), 0)
        orig_sl = safe_float(metadata.get("orig_sl"), safe_float(trade.get("sl"), safe_float(signal_row.get("sl"), 0)))
        risk_amount_total = max(abs(entry - orig_sl) * initial_size, 1e-9)

        final_size = max(remaining_size, 0.0)
        price_move_final = _trade_price_move(side, entry, close_price)
        pnl_usd_final = price_move_final * final_size
        pnl_r_final = pnl_usd_final / risk_amount_total
        pnl_pips_final = (price_move_final / XAU_PIP_SIZE) * (final_size / max(initial_size, 1e-9))

        pnl_usd_total = realized_pnl_usd + pnl_usd_final
        pnl_r_total = realized_pnl_r + pnl_r_final
        pnl_pips_total = realized_pnl_pips + pnl_pips_final

        metadata["remaining_position_size"] = 0.0
        metadata["final_close_at"] = now_iso
        metadata["final_close_reason"] = closed_status
        metadata["final_close_price"] = round(close_price, 5)
        metadata["realized_pnl_usd"] = round(pnl_usd_total, 6)
        metadata["realized_pnl_r"] = round(pnl_r_total, 6)
        metadata["realized_pnl_pips"] = round(pnl_pips_total, 6)
        update_row = {
            "status": trade_status,
            "closed_at": now_iso,
            "close_price": round(close_price, 5),
            "close_reason": closed_status,
            "pnl_usd": round(pnl_usd_total, 6),
            "pnl_r": round(pnl_r_total, 6),
            "pnl_pips": round(pnl_pips_total, 6),
            "position_size": 0.0,
            "metadata": metadata,
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
                    pnl_by_user_final[user_id] = safe_float(pnl_by_user_final.get(user_id), 0) + pnl_usd_final
                event_type = {
                    "HIT_TP2": "TP2",
                    "HIT_TP3": "TP3",
                    "HIT_SL": "STOP_LOSS",
                    "BREAKEVEN": "BREAKEVEN",
                    "EXPIRED": "EXPIRED",
                    "HIT_TP1": "TP1_PARTIAL",
                }.get(closed_status, "EXPIRED")
                record_demo_trade_event(
                    trade_id=trade_id,
                    signal_id=signal_id,
                    user_id=user_id,
                    lane=str(signal_row.get("lane", trade.get("lane", "intraday"))),
                    event_type=event_type,
                    event_price=close_price,
                    realized_size=final_size,
                    remaining_size=0.0,
                    pnl_usd=pnl_usd_final,
                    pnl_r=pnl_r_final,
                    pnl_pips=pnl_pips_final,
                    meta={
                        "close_reason": closed_status,
                        "total_pnl_usd": round(pnl_usd_total, 6),
                        "total_pnl_r": round(pnl_r_total, 6),
                        "total_pnl_pips": round(pnl_pips_total, 6),
                    },
                )
        except Exception as e:
            print(f"  WARNING: demo trade close failed for {trade_id}: {e}")

    if pnl_by_user_final:
        _apply_account_pnl_deltas(pnl_by_user_final, now_iso)

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
    conf_prev = confirm_df.iloc[-2] if len(confirm_df) > 1 else conf

    close = safe_float(latest.get("Close"), 0)
    atr = max(safe_float(latest.get("atr"), 0), max(close * 0.002, 0.1))
    adx = safe_float(conf.get("adx"), 0)
    conf_close = safe_float(conf.get("Close"), close)
    anchor = safe_float(conf.get("vwap"), 0) or safe_float(conf.get("sma50"), 0)
    sma50_now = safe_float(conf.get("sma50"), conf_close)
    sma50_prev = safe_float(conf_prev.get("sma50"), sma50_now)
    trend_slope = sma50_now - sma50_prev

    k_now = safe_float(latest.get("stochrsi_k"), 50)
    d_now = safe_float(latest.get("stochrsi_d"), 50)
    k_prev = safe_float(prev.get("stochrsi_k"), 50)
    d_prev = safe_float(prev.get("stochrsi_d"), 50)
    macd_now = safe_float(latest.get("macd_histogram"), 0)
    macd_prev = safe_float(prev.get("macd_histogram"), 0)
    k_mid = safe_float(latest.get("keltner_mid"), close)
    k_up = safe_float(latest.get("keltner_upper"), close)
    k_low = safe_float(latest.get("keltner_lower"), close)

    trend_adx_min = 16 if lane.name == "intraday" else 18
    if direction == "BUY":
        trend_price_ok = (conf_close >= (anchor * 0.9995)) or anchor == 0
        trend_slope_ok = trend_slope >= -(atr * 0.02)
    else:
        trend_price_ok = (conf_close <= (anchor * 1.0005)) or anchor == 0
        trend_slope_ok = trend_slope <= (atr * 0.02)
    trend_filter = adx >= trend_adx_min and trend_price_ok and trend_slope_ok

    if direction == "BUY":
        stoch_cross = k_prev <= d_prev and k_now >= d_now
        momentum = ((macd_now >= -0.02) and (macd_now >= (macd_prev - 0.01)) and (k_now >= d_now)) or (stoch_cross and k_now <= 72)
    else:
        stoch_cross = k_prev >= d_prev and k_now <= d_now
        momentum = ((macd_now <= 0.02) and (macd_now <= (macd_prev + 0.01)) and (k_now <= d_now)) or (stoch_cross and k_now >= 28)

    dist_mid_atr = (close - k_mid) / max(atr, 0.0001)
    if direction == "BUY":
        pullback = (-0.65 <= dist_mid_atr <= 1.10) and (close <= (k_up + atr * 0.35))
    else:
        pullback = (-1.10 <= dist_mid_atr <= 0.65) and (close >= (k_low - atr * 0.35))

    asian_breakout = False
    if lane.name == "intraday" and asian_range:
        asian_breakout = close > (asian_range["high"] + atr * 0.08) if direction == "BUY" else close < (asian_range["low"] - atr * 0.08)

    if session["is_asia"]:
        session_fit = pullback and (asian_breakout or adx <= 22)
    elif session["is_overlap"]:
        session_fit = trend_filter and momentum
    else:
        session_fit = trend_filter and (momentum or pullback)

    spread = spread_info.get("spread")
    spread_cap = max(0.30 if lane.name == "intraday" else 0.40, atr * 0.10)
    spread_ok = spread is None or safe_float(spread, 0) <= spread_cap
    atr_pct = atr / max(close, 1.0)
    vol_floor = 0.0010 if lane.name == "intraday" else 0.0013
    volatility_ok = (vol_floor <= atr_pct <= 0.0150) and spread_ok

    if lane.name == "intraday":
        weights = {
            "trend_structure": 24,
            "momentum": 22,
            "pullback_quality": 18,
            "volatility_spread": 14,
            "session_context": 14,
            "asian_range": 8,
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
            "trend_structure": 30,
            "momentum": 24,
            "pullback_quality": 20,
            "volatility_spread": 14,
            "session_context": 12,
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
        tp_mult = (1.25, 2.75, 4.20)
    elif regime == "RANGE":
        tp_mult = (0.90, 1.85, 2.80)
    else:
        tp_mult = (1.05, 2.25, 3.35)

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

    # Hybrid stop: keep ATR-vs-structure idea but cap extreme structure stops
    # so RR is not blocked by unusually distant recent swings.
    structure_cap = atr * (1.9 if lane.name == "intraday" else 2.4)
    structure_stop_used = min(structure_stop_dist, structure_cap)
    stop_dist = max(atr_stop_dist, structure_stop_used)
    stop_floor = atr * (0.65 if lane.name == "intraday" else 0.85)
    stop_ceiling = atr * (2.3 if lane.name == "intraday" else 2.8)
    stop_band_ok = stop_floor <= stop_dist <= stop_ceiling

    # Enforce at least 1:2 RR at TP2 by construction.
    tp1_dist = max(atr * tp_mult[0] * session_tp_mult, stop_dist * 1.0)
    tp2_dist = max(atr * tp_mult[1] * session_tp_mult, stop_dist * 2.0)
    tp3_dist = max(atr * tp_mult[2] * session_tp_mult, stop_dist * 2.8)

    if direction == "BUY":
        sl = close - stop_dist
        tp1 = close + tp1_dist
        tp2 = close + tp2_dist
        tp3 = close + tp3_dist
    else:
        sl = close + stop_dist
        tp1 = close - tp1_dist
        tp2 = close - tp2_dist
        tp3 = close - tp3_dist

    rr_tp2 = abs(tp2 - close) / max(abs(close - sl), 0.0001)
    rr_tp3 = abs(tp3 - close) / max(abs(close - sl), 0.0001)

    rr_required = max(2.0, lane.min_rr_tp2)
    rr_ok = rr_tp2 >= (rr_required - 1e-9)

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
    if regime == "RANGE":
        threshold -= 2
    if session_name == "ASIA":
        threshold -= 1
    threshold = max(66 if lane.name == "intraday" else 68, threshold)
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
        "atr_pct": round(atr_pct, 6),
        "trend_slope": round(trend_slope, 6),
        "rr_value": round(rr_tp2, 4),
        "rr_tp1_value": round(abs(tp1 - close) / max(abs(close - sl), 0.0001), 4),
        "rr_tp3_value": round(rr_tp3, 4),
        "rr_min_required": round(rr_required, 4),
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
        "structure_stop_used": round(structure_stop_used, 5),
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
    m = {"HIT_TP1": 1.0, "HIT_TP2": 2.0, "HIT_TP3": 3.0, "HIT_SL": -1.0, "BREAKEVEN": 0.0, "EXPIRED": -0.2}
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
    m = {"HIT_TP1": 1.0, "HIT_TP2": 2.0, "HIT_TP3": 3.0, "HIT_SL": -1.0, "BREAKEVEN": 0.0, "EXPIRED": -0.2}
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
    active = check_active_signals_by_lane()
    return active.get("intraday") or active.get("swing")


def manage_active_signal(active: dict, current_price: float) -> dict:
    kind = active.get("type")
    status = active.get("status", "ACTIVE")
    rr_value = safe_float(active.get("rr_value"), 0)
    tp1, tp2, tp3, sl = safe_float(active.get("tp1")), safe_float(active.get("tp2")), safe_float(active.get("tp3")), safe_float(active.get("sl"))
    entry = safe_float(active.get("entry_price"), 0)
    conditions_state = parse_json_object(active.get("conditions_met"))
    tp1_be_applied = bool(conditions_state.get("tp1_be_applied"))
    next_status = status
    update_payload: dict[str, Any] = {}
    tp1_partial_event = False

    # Cleanup guard for legacy rows created before strict RR>=2 policy.
    if status == "ACTIVE" and 0 < rr_value < 2.0:
        next_status = "EXPIRED"
        conditions_state["legacy_rr_cleanup"] = True
        conditions_state["legacy_rr_value"] = rr_value
        update_payload["conditions_met"] = json.dumps(conditions_state)

    if kind == "BUY":
        if current_price <= sl:
            next_status = "BREAKEVEN" if (tp1_be_applied and abs(sl - entry) <= 0.011) else "HIT_SL"
        elif current_price >= tp3:
            next_status = "HIT_TP3"
        elif current_price >= tp2 and status not in ("HIT_TP2", "HIT_TP3"):
            next_status = "HIT_TP2"
        elif current_price >= tp1 and not tp1_be_applied and entry > 0:
            update_payload["sl"] = round(entry, 5)
            conditions_state["tp1_be_applied"] = True
            conditions_state["tp1_be_at"] = datetime.now(timezone.utc).isoformat()
            update_payload["conditions_met"] = json.dumps(conditions_state)
            tp1_partial_event = True
    elif kind == "SELL":
        if current_price >= sl:
            next_status = "BREAKEVEN" if (tp1_be_applied and abs(sl - entry) <= 0.011) else "HIT_SL"
        elif current_price <= tp3:
            next_status = "HIT_TP3"
        elif current_price <= tp2 and status not in ("HIT_TP2", "HIT_TP3"):
            next_status = "HIT_TP2"
        elif current_price <= tp1 and not tp1_be_applied and entry > 0:
            update_payload["sl"] = round(entry, 5)
            conditions_state["tp1_be_applied"] = True
            conditions_state["tp1_be_at"] = datetime.now(timezone.utc).isoformat()
            update_payload["conditions_met"] = json.dumps(conditions_state)
            tp1_partial_event = True

    created = parse_dt(active.get("created_at"))
    if created and datetime.now(timezone.utc) - created > timedelta(hours=6) and next_status == "ACTIVE":
        next_status = "EXPIRED"

    updated_signal = dict(active)
    if next_status != status or update_payload:
        try:
            payload = dict(update_payload)
            if next_status != status:
                payload["status"] = next_status
            supabase.table("signals").update(payload).eq("id", active.get("id")).execute()
            updated_signal.update(update_payload)
            if next_status != status:
                updated_signal["status"] = next_status
                update_daily_risk_from_close(active, next_status)
                settle_demo_trades_for_signal(active, next_status, current_price)
                notify_signal_event(
                    updated_signal,
                    {
                        "HIT_TP2": "TP2",
                        "HIT_TP3": "TP3",
                        "HIT_SL": "STOP_LOSS",
                        "BREAKEVEN": "BREAKEVEN",
                        "EXPIRED": "EXPIRED",
                    }.get(next_status, next_status),
                    next_status,
                    event_price=current_price,
                )
                print(f"  Active signal updated: {status} -> {next_status}")
            elif update_payload.get("sl") is not None:
                if tp1_partial_event:
                    signal_for_demo = dict(active)
                    signal_for_demo["sl"] = update_payload.get("sl", active.get("sl"))
                    partial_count = apply_demo_tp1_partial(signal_for_demo, tp1)
                    if partial_count > 0:
                        print(f"  Demo TP1 partial fills: {partial_count}")
                    updated_signal["sl"] = update_payload.get("sl", active.get("sl"))
                    updated_signal["conditions_met"] = parse_json_object(update_payload.get("conditions_met"))
                    notify_signal_event(
                        updated_signal,
                        "TP1",
                        "TP1_HIT_AND_SL_MOVED_TO_BREAKEVEN",
                        event_price=tp1,
                    )
                print(f"  TP1 management: moved SL to breakeven at {update_payload['sl']}")
        except Exception as e:
            print(f"  WARNING: active signal update failed: {e}")
    return updated_signal


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


def run_signal_engine() -> None:
    print(f"\\n{'=' * 62}")
    print(f"Signal Engine v2 - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'=' * 62}")

    market_clock = get_market_clock_context()
    active_by_lane = check_active_signals_by_lane()
    sync_demo_trades_for_active_signals(active_by_lane)
    if not market_clock["market_open"]:
        print(f"  Market closed ({market_clock['reason']}): skipping candle fetch, signal generation, and signal expiry checks.")
        return

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

    for lane_name, active_signal in list(active_by_lane.items()):
        updated_signal = manage_active_signal(active_signal, current_price)
        if str(updated_signal.get("status", "")).upper() == "ACTIVE":
            active_by_lane[lane_name] = updated_signal
            create_demo_trades_for_signal(updated_signal)
        else:
            active_by_lane.pop(lane_name, None)

    candidates = []
    candidates_by_lane: dict[str, list[dict]] = {lane_name: [] for lane_name in LANE_ORDER}
    degrade_mode_active = False
    for lane in LANES.values():
        trigger_df = df_m15 if lane.name == "intraday" else df_h1
        confirm_df = df_h1 if lane.name == "intraday" else df_h4
        lane_session_metrics = rolling_lane_session_metrics(lane.name, session["name"], 120)
        threshold_adjust = 0
        if lane_session_metrics["count"] >= 20:
            if lane_session_metrics["expectancy"] < 0:
                threshold_adjust += 3
            if lane_session_metrics["drawdown_r"] > 3.0:
                threshold_adjust += 2
        if threshold_adjust > 0:
            degrade_mode_active = True
        for direction in ("BUY", "SELL"):
            candidate = build_candidate(
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
            candidates.append(candidate)
            candidates_by_lane[lane.name].append(candidate)

    candidates.sort(key=lambda x: x["score_total"], reverse=True)
    def payload_from(candidate: dict, why: str) -> dict:
        runtime = _candidate_ui_payload(candidate, "ACTIVE", why)
        return {
            "type": runtime["type"],
            "entry_price": runtime["entry_price"],
            "tp1": runtime["tp1"],
            "tp2": runtime["tp2"],
            "tp3": runtime["tp3"],
            "sl": runtime["sl"],
            "status": "ACTIVE",
            "confidence": runtime["confidence"],
            "conditions_met": _dump_json(runtime["conditions_met"]),
            "adx_value": runtime["adx_value"],
            "atr_value": runtime["atr_value"],
            "timeframe": runtime["timeframe"],
            "lane": runtime["lane"],
            "score_total": runtime["score_total"],
            "score_breakdown": _dump_json(runtime["score_breakdown"]),
            "blocked_reason": None,
            "rr_value": runtime["rr_value"],
            "risk_percent_used": runtime["risk_percent_used"],
            "position_size": runtime["position_size"],
            "session_context": runtime["session_context"],
            "news_context": _dump_json(runtime["news_context"]),
            "risk_context": _dump_json(
                {
                    "daily_loss_pct": safe_float(state.get("daily_loss_pct"), 0.0),
                    "consecutive_sl": int(state.get("consecutive_sl") or 0),
                    "degrade_mode": degrade_mode_active,
                }
            ),
        }

    lane_decisions: dict[str, dict] = {}
    lane_debug: dict[str, dict] = {}
    for lane_name in LANE_ORDER:
        lane_candidates = sorted(candidates_by_lane.get(lane_name, []), key=lambda x: x["score_total"], reverse=True)
        candidate_map = {str(c.get("type")).upper(): c for c in lane_candidates}
        best = lane_candidates[0] if lane_candidates else None
        best_pass = next((c for c in lane_candidates if c.get("blocked_reason") is None), None)
        active_signal = active_by_lane.get(lane_name)
        reason = "NO_CANDIDATE"
        decision_state = "NOT_READY"
        selected_payload: dict | None = None

        if active_signal and str(active_signal.get("status", "")).upper() == "ACTIVE":
            decision_state = "IN_TRADE"
            reason = "ACTIVE_TRADE_OPEN"
            selected_payload = _signal_ui_payload(active_signal, decision_state, reason)
        elif best:
            if not allow:
                reason = allow_reason
                decision_state = "BLOCKED"
                display_candidate = best_pass or best
                display_candidate["blocked_reason"] = allow_reason
                selected_payload = _candidate_ui_payload(display_candidate, decision_state, reason)
            elif best_pass is not None:
                reason = "PASSED_ALL_GATES"
                payload = payload_from(best_pass, reason)
                inserted = insert_signal(payload)
                if inserted:
                    print(f"  Signal stored: {best_pass['type']} {best_pass['lane'].upper()} | score={best_pass['score_total']}")
                    create_demo_trades_for_signal(inserted | {"status": "ACTIVE"})
                    notify_signal_event(inserted, "NEW_SIGNAL", reason, event_price=safe_float(inserted.get("entry_price"), 0))
                    active_by_lane[lane_name] = inserted
                    decision_state = "ACTIVE"
                    selected_payload = _signal_ui_payload(inserted, decision_state, reason)
                else:
                    decision_state = "BLOCKED"
                    reason = "INSERT_FAILED"
                    failed_candidate = dict(best_pass)
                    failed_candidate["blocked_reason"] = "INSERT_FAILED"
                    selected_payload = _candidate_ui_payload(failed_candidate, decision_state, reason)
            else:
                reason = best.get("blocked_reason") or "NO_CANDIDATE"
                decision_state = _decision_state_for_candidate(best)
                selected_payload = _candidate_ui_payload(best, decision_state, reason)
        else:
            selected_payload = _candidate_ui_payload(None, decision_state, reason)

        lane_decisions[lane_name] = {
            **(selected_payload or {}),
            "lane": lane_name,
            "selected_side": (selected_payload or {}).get("type") if (selected_payload or {}).get("type") not in {None, "WAIT"} else None,
            "selected_signal_id": (selected_payload or {}).get("signal_id") or (selected_payload or {}).get("id"),
            "market_price": round(current_price, 5),
            "candidates": {
                "buy": _candidate_ui_payload(candidate_map.get("BUY"), _decision_state_for_candidate(candidate_map.get("BUY")), candidate_map.get("BUY", {}).get("blocked_reason") or "READY"),
                "sell": _candidate_ui_payload(candidate_map.get("SELL"), _decision_state_for_candidate(candidate_map.get("SELL")), candidate_map.get("SELL", {}).get("blocked_reason") or "READY"),
            },
        }
        lane_debug[lane_name] = {
            "best": {"type": best.get("type"), "score": best.get("score_total"), "blocked_reason": best.get("blocked_reason")} if best else None,
            "selected": {"type": selected_payload.get("type"), "state": decision_state, "reason": reason} if selected_payload else None,
        }

    print(
        json.dumps(
            {
                "summary": {
                    "total_candidates": len(candidates),
                    "passing_candidates": len([c for c in candidates if c.get("blocked_reason") is None]),
                },
                "lanes": lane_debug,
            },
            indent=2,
        )
    )
    insert_decision_run(
        market_price=current_price,
        lane_payloads=lane_decisions,
        meta={
            "session": session,
            "news": news,
            "spread": spread_info,
            "degrade_mode": degrade_mode_active,
            "risk_state": state,
        },
    )

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
