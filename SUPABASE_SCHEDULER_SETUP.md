# Supabase Scheduler (Every 3 Minutes)

This runs collectors and the live signal-engine trigger from Supabase scheduler instead of GitHub cron.
XAUUSD automatic refresh should come only from:

- Supabase Scheduler
- Supabase Edge Function `price-collector`
- Supabase Edge Function `signal-engine-dispatcher`
- Twelve Data API
- `market_ticks`

## 1) Deploy edge function

```bash
supabase functions deploy price-collector
supabase functions deploy polymarket-collector
supabase functions deploy signal-engine-dispatcher
```

## 2) Set edge function secrets

Set these in Supabase project secrets:

- `TWELVE_DATA_API_KEY`
- `SUPABASE_URL` (your project URL)
- `SUPABASE_SERVICE_ROLE_KEY`
- `GH_WORKFLOW_TOKEN` (GitHub token allowed to dispatch Actions workflows)
- Optional: `GH_WORKFLOW_OWNER` (default `easony123`)
- Optional: `GH_WORKFLOW_REPO` (default `xauradar`)
- Optional: `GH_SIGNAL_WORKFLOW_ID` (default `signal_bot.yml`)
- Optional: `GH_SIGNAL_WORKFLOW_REF` (default `main`)
- Optional hardening: `SIGNAL_ENGINE_CRON_SECRET`
- Optional dedupe tuning: `SIGNAL_ENGINE_DISPATCH_MIN_GAP_SECONDS` (default `150`)
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
  GH_WORKFLOW_TOKEN=... \
  GH_WORKFLOW_OWNER="easony123" \
  GH_WORKFLOW_REPO="xauradar" \
  GH_SIGNAL_WORKFLOW_ID="signal_bot.yml" \
  GH_SIGNAL_WORKFLOW_REF="main" \
  TWELVE_SYMBOL="XAU/USD" \
  COINGECKO_API_KEY=... \
  POLYMARKET_BASE_URL="https://gamma-api.polymarket.com" \
  POLYMARKET_CURATED_LIMIT=18
```

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must be the Supabase service-role key.
- Do not use a publishable key such as `sb_publishable_...` for engine or collector runtime writes.
- GitHub Actions should store this under the repository secret name `SUPABASE_SERVICE_KEY`.
- `GH_WORKFLOW_TOKEN` should be a GitHub token that can call `workflow_dispatch` on this repo.
  For a fine-grained token, grant `Actions: Read and write` and `Contents: Read`.
  For a classic token, `repo` plus `workflow` is the safe minimum.
- The live signal bot workflow is now manual/dispatch-only; Supabase Scheduler becomes the primary trigger.

## 3) Create scheduler job (3 min)

Run:

- [`supabase/scheduler/price_collector_every_3m.sql`](supabase/scheduler/price_collector_every_3m.sql)
- [`supabase/scheduler/polymarket_collector_every_3m.sql`](supabase/scheduler/polymarket_collector_every_3m.sql)
- [`supabase/scheduler/signal_engine_dispatch_every_3m.sql`](supabase/scheduler/signal_engine_dispatch_every_3m.sql)

in Supabase SQL Editor.

These SQL files already target your current project URL and schedule every 3 minutes.
If `PRICE_COLLECTOR_CRON_SECRET` is enabled, set `v_price_collector_cron_secret` inside
`price_collector_every_3m.sql` to the same value before running it.
If `SIGNAL_ENGINE_CRON_SECRET` is enabled, set `v_signal_engine_cron_secret` inside
`signal_engine_dispatch_every_3m.sql` to the same value before running it.
If your live edge endpoint returns `401`, align auth in one of these two modes:

- Preferred: redeploy `price-collector` with `verify_jwt = false`, then leave `v_price_collector_auth_token` blank.
- Alternative: keep JWT auth enabled and set `v_price_collector_auth_token` in `price_collector_every_3m.sql`
  to the live service-role JWT so scheduler calls include `Authorization` and `apikey` headers.

## 4) Verify

1. `cron.job` contains `price-collector-every-3m`.
2. `cron.job` also contains `polymarket-collector-every-3m`.
3. `cron.job` also contains `signal-engine-dispatch-every-3m`.
4. `net._http_response` shows `200` calls every ~3 minutes.
5. `market_ticks` receives new rows every ~3 minutes.
6. `crypto_ticks` and `polymarket_markets` receive updates every ~3 minutes.
7. GitHub Actions `XAUUSD Signal Bot` receives `workflow_dispatch` runs every ~3 minutes.
8. Website source badge no longer flips to `STALE` during normal operation.
9. During the New York daily maintenance break, `price-collector` returns `skipped` and does not hit Twelve Data.

## 5) Fallback

GitHub scheduled cron is **not** the automatic XAUUSD refresh path anymore.
GitHub still runs the Python signal engine, but Supabase Scheduler now dispatches it.
`XAUUSD Price Collector Recovery` is a manual emergency workflow that calls the live edge function directly for debugging/recovery.
GitHub `Polymarket Collector` workflow is also **manual-only** fallback (`workflow_dispatch`).
