"""
Economic Calendar Scraper
=========================
Scrapes Forex Factory for high-impact USD events.
Stores results in Supabase `economic_events` table.
Run daily via GitHub Actions (Mon-Fri).
"""

import os
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FOREX_FACTORY_URL = "https://www.forexfactory.com/calendar"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def scrape_forex_factory():
    """
    Scrape this week's high-impact USD events from Forex Factory.
    Returns list of event dicts.
    """
    print("📅 Scraping Forex Factory calendar...")

    try:
        resp = requests.get(FOREX_FACTORY_URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ❌ Failed to fetch calendar: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    events = []

    # Forex Factory calendar rows
    rows = soup.select("tr.calendar__row")
    current_date = None

    for row in rows:
        try:
            # Date cell (only appears on first event of each day)
            date_cell = row.select_one("td.calendar__date span")
            if date_cell and date_cell.text.strip():
                date_text = date_cell.text.strip()
                try:
                    # Parse date like "Mon Apr 14"
                    year = datetime.now().year
                    current_date = datetime.strptime(f"{date_text} {year}", "%a %b %d %Y")
                except ValueError:
                    pass

            if current_date is None:
                continue

            # Currency
            currency_cell = row.select_one("td.calendar__currency")
            if not currency_cell:
                continue
            currency = currency_cell.text.strip()

            # Only USD events
            if currency != "USD":
                continue

            # Impact
            impact_cell = row.select_one("td.calendar__impact span")
            if not impact_cell:
                continue

            impact_class = " ".join(impact_cell.get("class", []))
            if "high" in impact_class.lower() or "red" in impact_class.lower():
                impact = "HIGH"
            elif "medium" in impact_class.lower() or "orange" in impact_class.lower():
                impact = "MEDIUM"
            else:
                continue  # Skip low impact

            # Only keep HIGH impact
            if impact != "HIGH":
                continue

            # Time
            time_cell = row.select_one("td.calendar__time")
            event_time = time_cell.text.strip() if time_cell else ""

            # Parse time (e.g., "8:30am")
            event_dt = current_date
            if event_time and event_time not in ("", "All Day", "Tentative"):
                try:
                    parsed_time = datetime.strptime(event_time, "%I:%M%p")
                    event_dt = current_date.replace(
                        hour=parsed_time.hour,
                        minute=parsed_time.minute
                    )
                    # Convert EST to UTC (+5 hours)
                    event_dt = event_dt + timedelta(hours=5)
                except ValueError:
                    pass

            # Event name
            event_cell = row.select_one("td.calendar__event span")
            event_name = event_cell.text.strip() if event_cell else "Unknown"

            # Previous / Forecast / Actual
            prev_cell = row.select_one("td.calendar__previous span")
            forecast_cell = row.select_one("td.calendar__forecast span")
            actual_cell = row.select_one("td.calendar__actual span")

            events.append({
                "event_date": event_dt.replace(tzinfo=timezone.utc).isoformat(),
                "currency": "USD",
                "event_name": event_name,
                "impact": impact,
                "previous": prev_cell.text.strip() if prev_cell else None,
                "forecast": forecast_cell.text.strip() if forecast_cell else None,
                "actual": actual_cell.text.strip() if actual_cell else None,
            })

        except Exception as e:
            continue  # Skip malformed rows

    print(f"  📊 Found {len(events)} high-impact USD events")
    return events


def store_events(events: list):
    """Upsert events into Supabase."""
    if not events:
        print("  ℹ️  No events to store")
        return

    # Clear old events (older than 7 days)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    try:
        supabase.table("economic_events") \
            .delete() \
            .lt("event_date", cutoff) \
            .execute()
    except Exception:
        pass

    # Insert new events
    for event in events:
        try:
            supabase.table("economic_events").upsert(
                event,
                on_conflict="event_date,event_name"
            ).execute()
        except Exception as e:
            print(f"  ⚠️  Error storing event '{event['event_name']}': {e}")

    print(f"  ✅ Stored {len(events)} events in Supabase")


def main():
    print("=" * 50)
    print(f"📅 Calendar Scraper — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 50)

    events = scrape_forex_factory()
    store_events(events)

    print("\n✅ Calendar scraper complete")


if __name__ == "__main__":
    main()
