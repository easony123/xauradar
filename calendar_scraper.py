"""
Economic Calendar Scraper
=========================
Fetches Forex Factory JSON feed(s) and stores upcoming events
for the next 7 days in Supabase `economic_events`.
Run daily via GitHub Actions (Mon-Fri).
"""

import os
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
REQUESTS_TRUST_ENV = os.getenv("REQUESTS_TRUST_ENV", "false").strip().lower() in ("1", "true", "yes", "on")
if not REQUESTS_TRUST_ENV:
    for _proxy_key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        os.environ.pop(_proxy_key, None)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
HTTP = requests.Session()
HTTP.trust_env = REQUESTS_TRUST_ENV
HTTP.headers.update({"User-Agent": "XAU-Radar-Calendar/1.0"})

FOREX_FACTORY_THISWEEK_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
# Forex Factory no longer serves ff_calendar_nextweek.json consistently.
# This query variant returns the next week's JSON feed.
FOREX_FACTORY_NEXTWEEK_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json?week=next"


def normalize_impact(value: str | None) -> str:
    text = (value or "").strip().upper()
    if text in ("HIGH", "MEDIUM", "LOW"):
        return text
    if "HIGH" in text:
        return "HIGH"
    if "MEDIUM" in text:
        return "MEDIUM"
    if "LOW" in text:
        return "LOW"
    return "LOW"


def parse_event_date(raw_date: str | None) -> str | None:
    if not raw_date:
        return None
    text = raw_date.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def fetch_json_with_retry(url: str, attempts: int = 3) -> list[dict]:
    for i in range(1, attempts + 1):
        try:
            resp = HTTP.get(url, timeout=30)
            resp.raise_for_status()
            payload = resp.json()
            if isinstance(payload, list):
                print(f"  OK: loaded {len(payload)} rows from {url}")
                return payload
        except Exception as e:
            retry_after = 0
            if hasattr(e, "response") and getattr(e, "response", None) is not None:
                ra = e.response.headers.get("Retry-After")
                if ra and ra.isdigit():
                    retry_after = int(ra)
            if i < attempts:
                wait_s = retry_after if retry_after > 0 else min(4 * i, 12)
                print(f"  WARN: Could not load {url} (attempt {i}/{attempts}): {e}. Retrying in {wait_s}s...")
                time.sleep(wait_s)
            else:
                print(f"  WARN: Could not load {url}: {e}")
    return []


def max_row_dt(rows: list[dict]) -> datetime | None:
    latest: datetime | None = None
    for row in rows:
        iso = parse_event_date(row.get("date"))
        if not iso:
            continue
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(timezone.utc)
        if latest is None or dt > latest:
            latest = dt
    return latest


def fetch_feed_rows() -> list[dict]:
    rows: list[dict] = []
    this_week = fetch_json_with_retry(FOREX_FACTORY_THISWEEK_URL)
    rows.extend(this_week)

    # Only request "next week" feed if current feed does not cover next-7-days window.
    latest = max_row_dt(this_week)
    need_next = latest is None or latest < (datetime.now(timezone.utc) + timedelta(days=6))
    if need_next:
        rows.extend(fetch_json_with_retry(FOREX_FACTORY_NEXTWEEK_URL))

    return rows


def fetch_forex_factory_events() -> list[dict]:
    """Fetch upcoming events from Forex Factory feeds."""
    print("Fetching Forex Factory feed(s)...")
    rows = fetch_feed_rows()
    if not rows:
        print("  ERROR: No calendar rows loaded")
        return []

    events = []
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=7)

    for row in rows:
        try:
            currency = (row.get("country") or row.get("currency") or "").strip().upper() or "UNK"
            impact = normalize_impact(row.get("impact"))
            if impact == "LOW":
                continue

            event_iso = parse_event_date(row.get("date"))
            if not event_iso:
                continue

            event_dt = datetime.fromisoformat(event_iso.replace("Z", "+00:00")).astimezone(timezone.utc)
            if event_dt < now or event_dt > end:
                continue

            events.append(
                {
                    "event_date": event_iso,
                    "currency": currency,
                    "event_name": (row.get("title") or "Unknown").strip(),
                    "impact": impact,
                    "previous": row.get("previous") or None,
                    "forecast": row.get("forecast") or None,
                    "actual": row.get("actual") or None,
                }
            )
        except Exception:
            continue

    # Deduplicate same event from overlapping feeds.
    dedup: dict[tuple[str, str, str], dict] = {}
    for ev in events:
        key = (ev["event_date"], ev["event_name"], ev["currency"])
        dedup[key] = ev

    final_events = sorted(dedup.values(), key=lambda e: e["event_date"])
    print(f"  Found {len(final_events)} events in next 7 days")
    return final_events


def store_events(events: list[dict]) -> None:
    """Upsert events into Supabase."""
    if not events:
        print("  INFO: No events to store")
        return

    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    try:
        supabase.table("economic_events").delete().lt("event_date", cutoff).execute()
        supabase.table("economic_events").delete().eq("impact", "LOW").execute()
    except Exception:
        pass

    inserted = 0
    for event in events:
        try:
            supabase.table("economic_events").upsert(event, on_conflict="event_date,event_name").execute()
            inserted += 1
        except Exception as e:
            print(f"  WARN: Error storing event '{event['event_name']}': {e}")

    print(f"  Stored {inserted} events in Supabase")


def main() -> None:
    print("=" * 50)
    print(f"Calendar Scraper - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 50)

    events = fetch_forex_factory_events()
    store_events(events)

    print("\nCalendar scraper complete")


if __name__ == "__main__":
    main()
