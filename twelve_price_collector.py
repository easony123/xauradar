"""
Twelve Data XAUUSD collector.

Fetches the latest XAU/USD price server-side and stores it in Supabase `market_ticks`.
Designed for GitHub Actions cadence jobs.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
SYMBOL = os.getenv("TWELVE_SYMBOL", "XAU/USD")
TWELVE_BASE_URL = "https://api.twelvedata.com"
REQUESTS_TRUST_ENV = os.getenv("REQUESTS_TRUST_ENV", "false").strip().lower() in ("1", "true", "yes", "on")
if not REQUESTS_TRUST_ENV:
    for _proxy_key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        os.environ.pop(_proxy_key, None)

HTTP = requests.Session()
HTTP.trust_env = REQUESTS_TRUST_ENV
MARKET_REOPEN_SUNDAY_UTC_HOUR = 22
MARKET_CLOSE_FRIDAY_UTC_HOUR = 22


def parse_float(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n > 0 else None


def parse_provider_ts(value: Any) -> datetime:
    if not value:
        return datetime.now(timezone.utc)

    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)

    if isinstance(value, str):
        text = value.strip().replace("Z", "+00:00")
        for fmt in ("%Y-%m-%d %H:%M:%S",):
            try:
                dt = datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                pass
        try:
            dt = datetime.fromisoformat(text)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return datetime.now(timezone.utc)


def clamp_to_recent(provider_ts: datetime, max_age_minutes: int = 30) -> datetime:
    now = datetime.now(timezone.utc)
    age_minutes = abs((now - provider_ts).total_seconds()) / 60.0
    if age_minutes > max_age_minutes:
        return now
    return provider_ts


def get_market_clock_context(now: datetime | None = None) -> dict[str, Any]:
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


def twelve_get(path: str, params: dict[str, Any]) -> dict[str, Any] | None:
    request_params = {**params, "apikey": TWELVE_DATA_API_KEY}
    try:
        # Keep requests fast so the 2m30 dual-cycle Actions job stays within runtime limits.
        resp = HTTP.get(f"{TWELVE_BASE_URL}{path}", params=request_params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"ERROR request {path}: {exc}")
        return None

    if str(data.get("status", "")).lower() == "error":
        print(f"ERROR endpoint {path}: {data.get('message', 'unknown error')}")
        return None

    return data


def fetch_tick() -> dict[str, Any] | None:
    # 1) Try quote endpoint first for the richest payload.
    quote = twelve_get("/quote", {"symbol": SYMBOL})
    if quote:
        price = parse_float(quote.get("close") or quote.get("price") or quote.get("last"))
        bid = parse_float(quote.get("bid"))
        ask = parse_float(quote.get("ask"))
        if price:
            raw_ts = quote.get("timestamp")
            if raw_ts is not None:
                provider_ts = parse_provider_ts(raw_ts)
            else:
                raw_dt = quote.get("datetime")
                # Some quote payloads provide date-only strings (YYYY-MM-DD).
                # Treat them as "now" to keep freshness/latency UI accurate.
                if isinstance(raw_dt, str) and len(raw_dt.strip()) == 10:
                    provider_ts = datetime.now(timezone.utc)
                else:
                    provider_ts = parse_provider_ts(raw_dt)
            provider_ts = clamp_to_recent(provider_ts)
            if bid is None:
                bid = price
            if ask is None:
                ask = price
            return {
                "provider_ts": provider_ts,
                "price": price,
                "bid": bid,
                "ask": ask,
                "source": "TD_LIVE",
                "is_delayed": False,
                "meta": {
                    "endpoint": "quote",
                    "quote_datetime": quote.get("datetime"),
                    "quote_timestamp": quote.get("timestamp"),
                },
            }

    # 2) Fallback to /price.
    price_resp = twelve_get("/price", {"symbol": SYMBOL})
    if price_resp:
        price = parse_float(price_resp.get("price"))
        if price:
            return {
                "provider_ts": datetime.now(timezone.utc),
                "price": price,
                "bid": price,
                "ask": price,
                "source": "TD_DELAYED",
                "is_delayed": True,
                "meta": {"endpoint": "price"},
            }

    # 3) Final fallback to latest 1m candle close.
    series = twelve_get(
        "/time_series",
        {
            "symbol": SYMBOL,
            "interval": "1min",
            "outputsize": 1,
            "order": "DESC",
            "timezone": "UTC",
        },
    )
    values = (series or {}).get("values") if series else None
    if values and len(values) > 0:
        row = values[0]
        close = parse_float(row.get("close"))
        if close:
            ts = parse_provider_ts(row.get("datetime"))
            return {
                "provider_ts": ts,
                "price": close,
                "bid": close,
                "ask": close,
                "source": "TD_DELAYED",
                "is_delayed": True,
                "meta": {"endpoint": "time_series_1m"},
            }

    return None


def write_tick(supabase: Client, tick: dict[str, Any]) -> None:
    payload = {
        "provider_ts": tick["provider_ts"].astimezone(timezone.utc).isoformat(),
        "symbol": SYMBOL,
        "price": round(float(tick["price"]), 5),
        "bid": round(float(tick["bid"]), 5),
        "ask": round(float(tick["ask"]), 5),
        "source": tick["source"],
        "is_delayed": bool(tick["is_delayed"]),
        "meta": tick["meta"],
    }
    supabase.table("market_ticks").insert(payload).execute()
    print(
        f"Inserted tick: {payload['symbol']} {payload['price']} "
        f"source={payload['source']} delayed={payload['is_delayed']} "
        f"ts={payload['provider_ts']}"
    )


def main() -> int:
    if not TWELVE_DATA_API_KEY:
        print("ERROR: Missing TWELVE_DATA_API_KEY")
        return 1
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return 1

    now_utc = datetime.now(timezone.utc).isoformat()
    print(f"Collector run start (UTC): {now_utc}")

    market_clock = get_market_clock_context()
    if not market_clock["market_open"]:
        print(f"Collector skipped: market closed ({market_clock['reason']}). No upstream Twelve Data request made.")
        return 0

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    tick = fetch_tick()
    if not tick:
        print("ERROR: No market tick fetched from Twelve Data")
        return 1

    print(
        "Fetched tick preview: "
        f"source={tick.get('source')} delayed={tick.get('is_delayed')} "
        f"provider_ts={tick.get('provider_ts').astimezone(timezone.utc).isoformat()}"
    )

    try:
        write_tick(supabase, tick)
    except Exception as exc:
        print(f"ERROR writing market tick: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
