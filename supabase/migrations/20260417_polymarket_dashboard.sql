-- Polymarket dashboard data tables (BTC + curated market probabilities)

CREATE TABLE IF NOT EXISTS public.crypto_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_ts TIMESTAMPTZ,
  symbol TEXT NOT NULL DEFAULT 'BTC/USD',
  price NUMERIC NOT NULL,
  change_24h NUMERIC,
  source TEXT NOT NULL DEFAULT 'COINGECKO',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.polymarket_markets (
  market_slug TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  probability NUMERIC NOT NULL,
  yes_price NUMERIC,
  no_price NUMERIC,
  volume NUMERIC,
  liquidity NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  end_date TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'POLYMARKET',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crypto_ticks_created_desc ON public.crypto_ticks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_ticks_symbol_created ON public.crypto_ticks (symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_markets_updated_desc ON public.polymarket_markets (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_polymarket_markets_category_prob ON public.polymarket_markets (category, probability DESC);

CREATE OR REPLACE FUNCTION public.touch_polymarket_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_polymarket_markets_updated_at ON public.polymarket_markets;
CREATE TRIGGER trg_polymarket_markets_updated_at
BEFORE UPDATE ON public.polymarket_markets
FOR EACH ROW
EXECUTE FUNCTION public.touch_polymarket_updated_at();

ALTER TABLE public.crypto_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polymarket_markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on crypto_ticks" ON public.crypto_ticks;
CREATE POLICY "Allow public read on crypto_ticks"
ON public.crypto_ticks FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow service write on crypto_ticks" ON public.crypto_ticks;
CREATE POLICY "Allow service write on crypto_ticks"
ON public.crypto_ticks FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on polymarket_markets" ON public.polymarket_markets;
CREATE POLICY "Allow public read on polymarket_markets"
ON public.polymarket_markets FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow service write on polymarket_markets" ON public.polymarket_markets;
CREATE POLICY "Allow service write on polymarket_markets"
ON public.polymarket_markets FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_ticks;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.polymarket_markets;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;
