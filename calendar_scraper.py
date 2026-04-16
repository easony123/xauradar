"""
Economic Calendar Scraper
=========================
Fetches Forex Factory weekly JSON feed for high-impact USD events.
Stores results in Supabase `economic_events` table.
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

FOREX_FACTORY_JSON_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"


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


def fetch_forex_factory_events() -> list[dict]:
    """Fetch this week's high-impact USD events from Forex Factory JSON feed."""
    print("Fetching Forex Factory weekly feed...")

    try:
        resp = requests.get(FOREX_FACTORY_JSON_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ERROR: Failed to fetch calendar feed: {e}")
        return []

    try:
        rows = resp.json()
    except Exception as e:
        print(f"  ERROR: Invalid JSON response: {e}")
        return []

    events = []

    for row in rows:
        try:
            currency = (row.get("country") or "").strip().upper()
            if currency != "USD":
                continue

            impact = normalize_impact(row.get("impact"))
            if impact != "HIGH":
                continue

            event_iso = parse_event_date(row.get("date"))
            if not event_iso:
                continue

            events.append(
                {
                    "event_date": event_iso,
                    "currency": "USD",
                    "event_name": (row.get("title") or "Unknown").strip(),
                    "impact": impact,
                    "previous": row.get("previous") or None,
                    "forecast": row.get("forecast") or None,
                    "actual": row.get("actual") or None,
                }
            )
        except Exception:
            continue

    print(f"  Found {len(events)} high-impact USD events")
    return events


def store_events(events: list[dict]) -> None:
    """Upsert events into Supabase."""
    if not events:
        print("  INFO: No events to store")
        return

    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    try:
        supabase.table("economic_events").delete().lt("event_date", cutoff).execute()
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
