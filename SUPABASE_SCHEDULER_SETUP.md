# Supabase Scheduler (Every 3 Minutes)

This runs collectors from Supabase scheduler instead of GitHub cron.

## 1) Deploy edge function

```bash
supabase functions deploy price-collector
supabase functions deploy polymarket-collector
```

## 2) Set edge function secrets

Set these in Supabase project secrets:

- `TWELVE_DATA_API_KEY`
- `SUPABASE_URL` (your project URL)
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `TWELVE_SYMBOL` (`XAU/USD`)
- Optional hardening: `PRICE_COLLECTOR_CRON_SECRET` (enable header check if you also add matching scheduler header)
- Optional: `COINGECKO_API_KEY` (for higher CoinGecko limits)
- Optional hardening: `POLYMARKET_COLLECTOR_CRON_SECRET`
- Optional: `POLYMARKET_BASE_URL` (default `https://gamma-api.polymarket.com`)
- Optional: `POLYMARKET_CURATED_LIMIT` (default `18`)

CLI example:

```bash
supabase secrets set \
  TWELVE_DATA_API_KEY=... \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  TWELVE_SYMBOL="XAU/USD" \
  COINGECKO_API_KEY=... \
  POLYMARKET_BASE_URL="https://gamma-api.polymarket.com" \
  POLYMARKET_CURATED_LIMIT=18
```

## 3) Create scheduler job (3 min)

Run:

- [`supabase/scheduler/price_collector_every_3m.sql`](supabase/scheduler/price_collector_every_3m.sql)
- [`supabase/scheduler/polymarket_collector_every_3m.sql`](supabase/scheduler/polymarket_collector_every_3m.sql)

in Supabase SQL Editor.

Both SQL files already target your current project URL and schedule every 3 minutes.
If `PRICE_COLLECTOR_CRON_SECRET` is enabled, set `v_price_collector_cron_secret` inside
`price_collector_every_3m.sql` to the same value before running it.
If your edge endpoint returns `UNAUTHORIZED_NO_AUTH_HEADER`, set
`v_price_collector_auth_token` in `price_collector_every_3m.sql` (JWT-style token)
or redeploy `price-collector` with `verify_jwt = false` to allow scheduler calls without auth.

## 4) Verify

1. `cron.job` contains `price-collector-every-3m`.
2. `cron.job` also contains `polymarket-collector-every-3m`.
3. `net._http_response` shows `200` calls every ~3 minutes.
4. `market_ticks` receives new rows every ~3 minutes.
5. `crypto_ticks` and `polymarket_markets` receive updates every ~3 minutes.
6. Website source badge no longer flips to `STALE` during normal operation.

## 5) Fallback

GitHub `Twelve Data Price Collector` workflow also runs on a **5-minute fallback schedule**
and still supports manual dispatch (`workflow_dispatch`).
GitHub `Polymarket Collector` workflow is also **manual-only** fallback (`workflow_dispatch`).
