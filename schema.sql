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

-- 4. Enable Row Level Security (allow public reads)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;

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

-- Allow service role inserts/updates (for Python bot)
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

-- 5. Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE signals;
ALTER PUBLICATION supabase_realtime ADD TABLE indicator_snapshots;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicator_created ON indicator_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON economic_events(event_date);

-- 7. Auto-cleanup: delete indicator snapshots older than 7 days (run via pg_cron or manually)
-- SELECT cron.schedule('cleanup-snapshots', '0 0 * * *', $$DELETE FROM indicator_snapshots WHERE created_at < NOW() - INTERVAL '7 days'$$);
