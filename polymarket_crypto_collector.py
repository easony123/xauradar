"""
Polymarket + BTC collector.

Manual/backup collector for GitHub Actions.
Primary cadence is expected from Supabase scheduler edge function.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "").strip()
POLYMARKET_BASE_URL = (os.getenv("POLYMARKET_BASE_URL") or "https://gamma-api.polymarket.com").rstrip("/")

ALLOWED_POLY_CATEGORIES = {
    "trending",
    "breaking",
    "new",
    "politics",
    "finance",
    "geopolitics",
    "oil",
    "xauusd",
}


def parse_num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def to_iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
    text = str(value).strip()
    if not text:
        return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def parse_maybe_array(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


def normalize_probability(raw: Any, fallback_yes_price: float | None) -> float | None:
    n = parse_num(raw)
    if n is not None:
        if 0 <= n <= 1:
            return n * 100
        if 0 <= n <= 100:
            return n
    if fallback_yes_price is not None:
        return max(0.0, min(100.0, fallback_yes_price * 100))
    return None


def classify_category(text: str) -> str:
    t = text.lower()
    if re.search(r"\b(trending|trend)\b", t):
        return "trending"
    if re.search(r"\b(breaking|headline|urgent)\b", t):
        return "breaking"
    if re.search(r"\b(new|latest|fresh)\b", t):
        return "new"
    if re.search(r"\b(gold|xau|xauusd|bullion|precious metal)\b", t):
        return "xauusd"
    if re.search(r"\b(oil|brent|wti|crude|opec|energy)\b", t):
        return "oil"
    if re.search(r"\b(politics|election|president|senate|congress|minister|government|white house|parliament|trump|biden)\b", t):
        return "politics"
    if re.search(r"\b(war|ukraine|russia|israel|gaza|taiwan|geopolitic|missile|sanction|ceasefire|conflict|putin|xi jinping|iran|nato|military)\b", t):
        return "geopolitics"
    if re.search(r"\b(finance|financial|fomc|fed|powell|rate cut|rate hike|interest rate|us rates|cpi|pce|nfp|inflation|gdp|economy|tariff|yield|stocks|nasdaq|dow|s&p|bond|dollar|usd)\b", t):
        return "finance"
    return "other"


def slugify(text: str) -> str:
    out = []
    last_dash = False
    for ch in text.lower():
        if ch.isalnum():
            out.append(ch)
            last_dash = False
        else:
            if not last_dash:
                out.append("-")
                last_dash = True
    slug = "".join(out).strip("-")
    return slug[:120] or "market"


def fetch_btc_tick() -> dict[str, Any] | None:
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": "bitcoin",
        "vs_currencies": "usd",
        "include_24hr_change": "true",
        "include_last_updated_at": "true",
    }
    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=12)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"ERROR CoinGecko request: {exc}")
        return None

    btc = data.get("bitcoin") if isinstance(data, dict) else None
    if not isinstance(btc, dict):
        return None

    price = parse_num(btc.get("usd"))
    if price is None:
        return None

    return {
        "provider_ts": to_iso(btc.get("last_updated_at")) or datetime.now(timezone.utc).isoformat(),
        "symbol": "BTC/USD",
        "price": round(price, 6),
        "change_24h": parse_num(btc.get("usd_24h_change")),
        "source": "COINGECKO",
        "meta": {"endpoint": "simple/price"},
    }


def normalize_market_row(row: dict[str, Any]) -> dict[str, Any] | None:
    title = str(row.get("question") or row.get("title") or row.get("name") or "").strip()
    if not title:
        return None

    yes_price = parse_num(row.get("yes_price") or row.get("yesPrice"))
    no_price = parse_num(row.get("no_price") or row.get("noPrice"))

    outcome_prices = parse_maybe_array(row.get("outcomePrices") or row.get("outcome_prices"))
    nums = [n for n in (parse_num(v) for v in outcome_prices) if n is not None]
    if yes_price is None and len(nums) > 0:
        yes_price = nums[0]
    if no_price is None and len(nums) > 1:
        no_price = nums[1]

    probability = normalize_probability(row.get("probability"), yes_price)
    if probability is None:
        return None

    tags_blob = ""
    for tag in parse_maybe_array(row.get("tags")):
        if isinstance(tag, dict):
            tags_blob += f" {tag.get('label', '')} {tag.get('name', '')}"
        else:
            tags_blob += f" {tag}"

    context_blob = " ".join(
        str(v or "")
        for v in [
            title,
            row.get("description", ""),
            row.get("category", ""),
            row.get("series", ""),
            row.get("topic", ""),
            tags_blob,
        ]
    )
    category = classify_category(context_blob)
    if category == "other" or category not in ALLOWED_POLY_CATEGORIES:
        return None

    slug = str(row.get("slug") or row.get("market_slug") or row.get("id") or "").strip()
    if not slug:
        slug = f"{category}-{slugify(title)}"

    status = "active"
    if row.get("closed") is True or row.get("active") is False:
        status = "closed"
    if row.get("resolved") is True or row.get("archived") is True:
        status = "resolved"

    return {
        "market_slug": slug,
        "provider_ts": to_iso(row.get("updatedAt") or row.get("updated_at") or row.get("createdAt") or row.get("created_at")) or datetime.now(timezone.utc).isoformat(),
        "title": title[:240],
        "category": category,
        "probability": round(max(0.0, min(100.0, probability)), 4),
        "yes_price": round(yes_price, 6) if yes_price is not None else None,
        "no_price": round(no_price, 6) if no_price is not None else None,
        "volume": round(parse_num(row.get("volume") or row.get("volumeNum") or row.get("volumeUsd")) or 0.0, 2),
        "liquidity": round(parse_num(row.get("liquidity") or row.get("liquidityNum")) or 0.0, 2),
        "status": status,
        "end_date": to_iso(row.get("endDate") or row.get("end_date") or row.get("resolveBy")),
        "source": "POLYMARKET",
        "meta": {
            "market_id": row.get("id"),
            "outcomes": row.get("outcomes"),
        },
    }


def fetch_polymarket_markets() -> list[dict[str, Any]]:
    params = {"active": "true", "closed": "false", "limit": "1000"}
    try:
        resp = requests.get(f"{POLYMARKET_BASE_URL}/markets", params=params, timeout=14)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"ERROR Polymarket request: {exc}")
        return []

    if not isinstance(data, list):
        return []

    normalized = []
    for item in data:
        if not isinstance(item, dict):
            continue
        row = normalize_market_row(item)
        if row:
            normalized.append(row)

    normalized.sort(key=lambda r: float(r.get("volume", 0) or 0) + float(r.get("liquidity", 0) or 0), reverse=True)
    return normalized


def main() -> int:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return 1

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    btc_tick = fetch_btc_tick()
    markets = fetch_polymarket_markets()

    if btc_tick:
        try:
            supabase.table("crypto_ticks").insert(btc_tick).execute()
            print(f"Inserted BTC tick: {btc_tick['price']} change24h={btc_tick.get('change_24h')}")
        except Exception as exc:
            print(f"ERROR writing crypto_ticks: {exc}")
            return 1
    else:
        print("WARN: No BTC tick fetched")

    if markets:
        try:
            supabase.table("polymarket_markets").delete().neq("market_slug", "").execute()
            supabase.table("polymarket_markets").upsert(markets, on_conflict="market_slug").execute()
            print(f"Upserted Polymarket markets: {len(markets)}")
        except Exception as exc:
            print(f"ERROR writing polymarket_markets: {exc}")
            return 1
    else:
        print("WARN: No Polymarket markets fetched for allowed categories")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
