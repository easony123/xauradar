import json
import urllib.request

API_KEY = "34FMvo_3DD6hL54apDwMKPXNk_aa86uv"

urls = {
    "quote": f"https://api.polygon.io/v1/last_quote/currencies/XAU/USD?apiKey={API_KEY}",
    "prev_agg": f"https://api.polygon.io/v2/aggs/ticker/C:XAUUSD/prev?adjusted=true&apiKey={API_KEY}",
}

for name, url in urls.items():
    print(f"\n=== {name.upper()} ===")
    try:
        response = urllib.request.urlopen(url)
        payload = json.loads(response.read().decode())
        print(json.dumps(payload, indent=2)[:2000])
    except Exception as e:
        try:
            print(e.read().decode())
        except Exception:
            print(e)
