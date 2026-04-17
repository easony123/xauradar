-- ============================================================
-- XAUUSD Trading Signal Dashboard — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Signals table
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  entry_price NUMERIC NOT NULL,
  tp1 NUMERIC NOT NULL,
  tp2 NUMERIC NOT NULL,
  tp3 NUMERIC NOT NULL,
  sl NUMERIC NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'EXPIRED')),
  confidence NUMERIC DEFAULT 0,
  conditions_met JSONB DEFAULT '{}',
  adx_value NUMERIC DEFAULT 0,
  atr_value NUMERIC DEFAULT 0,
  timeframe TEXT DEFAULT 'M15'
);

-- 2. Indicator snapshots table
CREATE TABLE IF NOT EXISTS indicator_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  adx NUMERIC DEFAULT 0,
  vwap NUMERIC DEFAULT 0,
  stochrsi_k NUMERIC DEFAULT 0,
  stochrsi_d NUMERIC DEFAULT 0,
  macd_histogram NUMERIC DEFAULT 0,
  keltner_upper NUMERIC DEFAULT 0,
  keltner_lower NUMERIC DEFAULT 0,
  atr NUMERIC DEFAULT 0,
  dxy_price NUMERIC DEFAULT 0,
  dxy_direction TEXT DEFAULT 'FLAT'
);

-- 3. Economic events table
CREATE TABLE IF NOT EXISTS economic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date TIMESTAMPTZ NOT NULL,
  currency TEXT DEFAULT 'USD',
  event_name TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('HIGH', 'MEDIUM', 'LOW')),
  previous TEXT,
  forecast TEXT,
  actual TEXT,
  UNIQUE(event_date, event_name)
);

-- 4. Market ticks cache table (collector writes, frontend reads)
CREATE TABLE IF NOT EXISTS market_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  provider_ts TIMESTAMPTZ,
  symbol TEXT DEFAULT 'XAU/USD',
  price NUMERIC NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  source TEXT DEFAULT 'TD_DELAYED',
  is_delayed BOOLEAN DEFAULT true,
  meta JSONB DEFAULT '{}'
);

-- 5. Crypto ticks table (for Polymarket dashboard BTC panel)
CREATE TABLE IF NOT EXISTS crypto_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  provider_ts TIMESTAMPTZ,
  symbol TEXT DEFAULT 'BTC/USD',
  price NUMERIC NOT NULL,
  change_24h NUMERIC,
  source TEXT DEFAULT 'COINGECKO',
  meta JSONB DEFAULT '{}'
);

-- 6. Curated Polymarket markets cache table
CREATE TABLE IF NOT EXISTS polymarket_markets (
  market_slug TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  provider_ts TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  probability NUMERIC NOT NULL,
  yes_price NUMERIC,
  no_price NUMERIC,
  volume NUMERIC,
  liquidity NUMERIC,
  status TEXT DEFAULT 'active',
  end_date TIMESTAMPTZ,
  source TEXT DEFAULT 'POLYMARKET',
  meta JSONB DEFAULT '{}'
);

-- 7. Enable Row Level Security (allow public reads)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE polymarket_markets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for frontend
CREATE POLICY "Allow public read on signals"
  ON signals FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on indicator_snapshots"
  ON indicator_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on economic_events"
  ON economic_events FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on market_ticks"
  ON market_ticks FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on crypto_ticks"
  ON crypto_ticks FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on polymarket_markets"
  ON polymarket_markets FOR SELECT
  USING (true);

-- Allow service role inserts/updates (for collectors and bots)
CREATE POLICY "Allow service write on signals"
  ON signals FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service write on indicator_snapshots"
  ON indicator_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service write on economic_events"
  ON economic_events FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service write on market_ticks"
  ON market_ticks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service write on crypto_ticks"
  ON crypto_ticks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service write on polymarket_markets"
  ON polymarket_markets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE signals;
ALTER PUBLICATION supabase_realtime ADD TABLE indicator_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE market_ticks;
ALTER PUBLICATION supabase_realtime ADD TABLE crypto_ticks;
ALTER PUBLICATION supabase_realtime ADD TABLE polymarket_markets;

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicator_created ON indicator_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON economic_events(event_date);
CREATE INDEX IF NOT EXISTS idx_market_ticks_created ON market_ticks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_ticks_created ON crypto_ticks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_markets_updated ON polymarket_markets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_markets_category_prob ON polymarket_markets(category, probability DESC);

-- 10. Auto-cleanup: delete indicator snapshots older than 7 days (run via pg_cron or manually)
-- SELECT cron.schedule('cleanup-snapshots', '0 0 * * *', $$DELETE FROM indicator_snapshots WHERE created_at < NOW() - INTERVAL '7 days'$$);
