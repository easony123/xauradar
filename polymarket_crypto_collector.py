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
TOP_MARKETS_LIMIT = int(os.getenv("POLYMARKET_TOP_MARKETS_LIMIT", "15") or "15")
ACTIVE_MARKETS_LIMIT = int(os.getenv("POLYMARKET_ACTIVE_MARKETS_LIMIT", "180") or "180")
COMMODITIES_EVENTS_LIMIT = int(os.getenv("POLYMARKET_COMMODITIES_EVENTS_LIMIT", "120") or "120")
RECENT_MARKETS_LIMIT = int(os.getenv("POLYMARKET_RECENT_MARKETS_LIMIT", "30") or "30")

CATEGORY_PRIORITY = {
    "xauusd": 80,
    "oil": 75,
    "geopolitics": 70,
    "crypto": 68,
    "politics": 65,
    "finance": 60,
    "breaking": 50,
    "new": 45,
    "trending": 40,
    "other": 0,
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


def classify_content_category(text: str) -> str:
    t = text.lower()
    if re.search(r"\b(breaking|headline|urgent)\b", t):
        return "breaking"
    if re.search(r"\b(xauusd|xau|spot gold|gold price|bullion|precious metal)\b", t):
        return "xauusd"
    if re.search(r"\b(oil|brent|wti|crude|opec|energy)\b", t):
        return "oil"
    if re.search(r"\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)\b", t):
        return "crypto"
    if re.search(r"\b(politics|election|president|senate|congress|minister|government|white house|parliament|trump|biden)\b", t):
        return "politics"
    if re.search(r"\b(war|ukraine|russia|israel|gaza|taiwan|geopolitic|missile|sanction|ceasefire|conflict|putin|xi jinping|iran|nato|military)\b", t):
        return "geopolitics"
    if re.search(r"\b(finance|financial|fomc|fed|powell|rate cut|rate hike|interest rate|us rates|cpi|pce|nfp|inflation|gdp|economy|tariff|yield|stocks|nasdaq|dow|s&p|bond|dollar|usd|bitcoin|btc|ethereum|eth|solana|crypto|token|coin|doge|memecoin|altcoin|defi|etf)\b", t):
        return "finance"
    return "other"


def derive_display_categories(text: str, source_tag: str, raw_category: str = "") -> list[str]:
    blob = f"{raw_category} {text}".lower()
    categories: list[str] = []
    content = classify_content_category(blob)
    if content != "other":
        categories.append(content)
    if re.search(r"\b(breaking|headline|urgent|flash|developing)\b", blob):
        categories.append("breaking")
    if source_tag == "recent":
        categories.append("new")
    if source_tag == "top":
        categories.append("trending")
    if source_tag == "active" and not categories:
        categories.append("trending")

    deduped: list[str] = []
    for cat in categories:
        if cat not in deduped:
            deduped.append(cat)
    return deduped or ["other"]


def choose_display_category(text: str, source_tag: str, raw_category: str = "") -> str:
    categories = derive_display_categories(text, source_tag, raw_category)
    return max(categories, key=lambda cat: CATEGORY_PRIORITY.get(cat, 0))


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


def normalize_market_row(row: dict[str, Any], source_tag: str = "top") -> dict[str, Any] | None:
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
    raw_category = str(row.get("category") or "").strip().lower() or "other"
    display_categories = derive_display_categories(context_blob, source_tag, raw_category)
    display_category = max(display_categories, key=lambda cat: CATEGORY_PRIORITY.get(cat, 0))

    slug = str(row.get("slug") or row.get("market_slug") or row.get("id") or "").strip()
    if not slug:
        slug = f"{display_category}-{slugify(title)}"

    status = "active"
    if row.get("closed") is True or row.get("active") is False:
        status = "closed"
    if row.get("resolved") is True or row.get("archived") is True:
        status = "resolved"

    return {
        "market_slug": slug,
        "provider_ts": to_iso(row.get("updatedAt") or row.get("updated_at") or row.get("createdAt") or row.get("created_at")) or datetime.now(timezone.utc).isoformat(),
        "title": title[:240],
        "category": raw_category,
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
            "raw_category": raw_category,
            "display_category": display_category,
            "display_categories": display_categories,
            "collector_source": source_tag,
        },
    }


def _fetch_json(path: str, params: dict[str, Any]) -> Any:
    try:
        resp = requests.get(f"{POLYMARKET_BASE_URL}{path}", params=params, timeout=18)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"ERROR Polymarket request {path}: {exc}")
        return None


def fetch_top_volume_markets() -> list[dict[str, Any]]:
    data = _fetch_json(
        "/markets",
        {
            "active": "true",
            "closed": "false",
            "order": "volumeNum",
            "ascending": "false",
            "limit": str(TOP_MARKETS_LIMIT),
        },
    )
    if not isinstance(data, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        row = normalize_market_row(item, "top")
        if row:
            rows.append(row)
    return rows


def fetch_active_markets() -> list[dict[str, Any]]:
    data = _fetch_json(
        "/markets",
        {
            "active": "true",
            "closed": "false",
            "order": "volumeNum",
            "ascending": "false",
            "limit": str(ACTIVE_MARKETS_LIMIT),
        },
    )
    if not isinstance(data, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        row = normalize_market_row(item, "active")
        if row:
            rows.append(row)
    return rows


def fetch_recent_markets() -> list[dict[str, Any]]:
    data = _fetch_json(
        "/markets",
        {
            "active": "true",
            "closed": "false",
            "order": "createdAt",
            "ascending": "false",
            "limit": str(RECENT_MARKETS_LIMIT),
        },
    )
    if not isinstance(data, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        row = normalize_market_row(item, "recent")
        if row:
            rows.append(row)
    return rows


def fetch_commodity_event_markets() -> list[dict[str, Any]]:
    data = _fetch_json(
        "/events",
        {
            "tag_slug": "commodities",
            "closed": "false",
            "limit": str(COMMODITIES_EVENTS_LIMIT),
        },
    )
    if not isinstance(data, list):
        return []

    rows: list[dict[str, Any]] = []
    for event in data:
        if not isinstance(event, dict):
            continue
        event_context = " ".join(
            str(v or "")
            for v in [
                event.get("title"),
                event.get("question"),
                event.get("slug"),
                event.get("description"),
                "commodities",
            ]
        )
        markets = event.get("markets")
        if not isinstance(markets, list):
            continue
        for market in markets:
            if not isinstance(market, dict):
                continue
            merged = {
                **market,
                "category": market.get("category") or event.get("category") or "commodities",
                "description": f"{market.get('description', '')} {event_context}".strip(),
            }
            row = normalize_market_row(merged, "commodity")
            if row and row.get("meta", {}).get("display_category") in {"xauusd", "oil"}:
                rows.append(row)
    return rows


def merge_markets(*market_lists: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for market_list in market_lists:
        for row in market_list:
            slug = str(row.get("market_slug") or "").strip()
            if not slug:
                continue
            display_category = str((row.get("meta") or {}).get("display_category") or "other")
            existing = merged.get(slug)
            if not existing:
                merged[slug] = row
                continue
            existing_display = str((existing.get("meta") or {}).get("display_category") or "other")
            if CATEGORY_PRIORITY.get(display_category, 0) > CATEGORY_PRIORITY.get(existing_display, 0):
                merged[slug] = row
                continue
            existing_volume = parse_num(existing.get("volume")) or 0.0
            new_volume = parse_num(row.get("volume")) or 0.0
            if new_volume > existing_volume:
                merged[slug] = row
    output = list(merged.values())
    output.sort(key=lambda r: float(r.get("volume", 0) or 0) + float(r.get("liquidity", 0) or 0), reverse=True)
    return output


def main() -> int:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return 1

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    btc_tick = fetch_btc_tick()
    top_markets = fetch_top_volume_markets()
    active_markets = fetch_active_markets()
    recent_markets = fetch_recent_markets()
    commodity_markets = fetch_commodity_event_markets()
    markets = merge_markets(top_markets, active_markets, recent_markets, commodity_markets)

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
            print(
                "Upserted Polymarket markets:"
                f" {len(markets)} (top={len(top_markets)}, active={len(active_markets)}, recent={len(recent_markets)}, commodities={len(commodity_markets)})"
            )
        except Exception as exc:
            print(f"ERROR writing polymarket_markets: {exc}")
            return 1
    else:
        print("WARN: No Polymarket markets fetched")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
