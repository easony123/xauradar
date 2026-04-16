"""
Economic Calendar Scraper
=========================
Fetches Forex Factory JSON feed(s) and stores upcoming events
for the next 7 days in Supabase `economic_events`.
Run daily via GitHub Actions (Mon-Fri).
"""

import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FOREX_FACTORY_JSON_URLS = [
    "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
]


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


def fetch_feed_rows() -> list[dict]:
    rows: list[dict] = []
    for url in FOREX_FACTORY_JSON_URLS:
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            payload = resp.json()
            if isinstance(payload, list):
                rows.extend(payload)
                print(f"  OK: loaded {len(payload)} rows from {url}")
        except Exception as e:
            print(f"  WARN: Could not load {url}: {e}")
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
