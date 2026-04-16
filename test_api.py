import json
import os
import urllib.parse
import urllib.request

API_KEY = os.getenv("TWELVE_DATA_API_KEY")
if not API_KEY:
    raise RuntimeError("Set TWELVE_DATA_API_KEY before running test_api.py")

base = "https://api.twelvedata.com"
queries = {
    "quote": {"symbol": "XAU/USD"},
    "price": {"symbol": "XAU/USD"},
    "time_series_1m": {"symbol": "XAU/USD", "interval": "1min", "outputsize": 3, "timezone": "UTC"},
}

for endpoint, params in queries.items():
    query = urllib.parse.urlencode({**params, "apikey": API_KEY})
    url = f"{base}/{endpoint}?{query}"
    print(f"\n=== {endpoint.upper()} ===")
    try:
        response = urllib.request.urlopen(url)
        payload = json.loads(response.read().decode())
        print(json.dumps(payload, indent=2)[:2000])
    except Exception as exc:
        try:
            print(exc.read().decode())
        except Exception:
            print(exc)
