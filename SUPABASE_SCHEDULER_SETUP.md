# Supabase Scheduler (Every 3 Minutes)

This switches price collection from GitHub cron to Supabase scheduler.

## 1) Deploy edge function

```bash
supabase functions deploy price-collector
```

## 2) Set edge function secrets

Set these in Supabase project secrets:

- `TWELVE_DATA_API_KEY`
- `SUPABASE_URL` (your project URL)
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `TWELVE_SYMBOL` (`XAU/USD`)
- Optional hardening: `PRICE_COLLECTOR_CRON_SECRET` (enable header check if you also add matching scheduler header)

CLI example:

```bash
supabase secrets set TWELVE_DATA_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TWELVE_SYMBOL="XAU/USD"
```

## 3) Create scheduler job (3 min)

Run:

- [`supabase/scheduler/price_collector_every_3m.sql`](supabase/scheduler/price_collector_every_3m.sql)

in Supabase SQL Editor.

The SQL file already targets your current project URL and schedules every 3 minutes.

## 4) Verify

1. `cron.job` contains `price-collector-every-3m`.
2. `net._http_response` shows `200` calls every ~3 minutes.
3. `market_ticks` receives new rows every ~3 minutes.
4. Website source badge no longer flips to `STALE` during normal operation.

## 5) Fallback

GitHub `Twelve Data Price Collector` workflow remains as **manual-only** fallback (`workflow_dispatch`).
