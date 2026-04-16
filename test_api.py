import urllib.request
import json
try:
    response = urllib.request.urlopen("https://api.massive.com/v2/aggs/ticker/C:XAUUSD/range/15/minute/2026-04-14/2026-04-15?apiKey=34FMvo_3DD6hL54apDwMKPXNk_aa86uv")
    print(response.read().decode())
except Exception as e:
    try:
        print(e.read().decode())
    except:
        print(e)
