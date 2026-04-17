-- Demo paper account system (per-user) for XAU Radar

CREATE TABLE IF NOT EXISTS public.demo_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  starting_capital NUMERIC NOT NULL DEFAULT 100000,
  balance NUMERIC NOT NULL DEFAULT 100000,
  equity NUMERIC NOT NULL DEFAULT 100000,
  auto_trade_enabled BOOLEAN NOT NULL DEFAULT true,
  risk_model JSONB NOT NULL DEFAULT '{"mode":"risk_percent","risk_percent":0.50}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  lane TEXT NOT NULL DEFAULT 'intraday',
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WIN', 'LOSS', 'EXPIRED')),
  entry NUMERIC NOT NULL,
  sl NUMERIC NOT NULL,
  tp1 NUMERIC NOT NULL,
  tp2 NUMERIC NOT NULL,
  tp3 NUMERIC NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_price NUMERIC,
  close_reason TEXT,
  risk_percent_used NUMERIC NOT NULL DEFAULT 0.50,
  position_size NUMERIC NOT NULL DEFAULT 0,
  pnl_usd NUMERIC,
  pnl_r NUMERIC,
  pnl_pips NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT demo_trades_user_signal_unique UNIQUE (user_id, signal_id)
);

CREATE TABLE IF NOT EXISTS public.demo_equity_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  balance NUMERIC NOT NULL,
  equity NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_accounts_updated ON public.demo_accounts (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_trades_user_status_opened ON public.demo_trades (user_id, status, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_trades_signal_status ON public.demo_trades (signal_id, status);
CREATE INDEX IF NOT EXISTS idx_demo_equity_points_user_ts ON public.demo_equity_points (user_id, ts DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_accounts_updated_at ON public.demo_accounts;
CREATE TRIGGER trg_demo_accounts_updated_at
BEFORE UPDATE ON public.demo_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_equity_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can read own demo account" ON public.demo_accounts;
CREATE POLICY "User can read own demo account"
ON public.demo_accounts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can insert own demo account" ON public.demo_accounts;
CREATE POLICY "User can insert own demo account"
ON public.demo_accounts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can update own demo account" ON public.demo_accounts;
CREATE POLICY "User can update own demo account"
ON public.demo_accounts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can read own demo trades" ON public.demo_trades;
CREATE POLICY "User can read own demo trades"
ON public.demo_trades
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User can read own demo equity points" ON public.demo_equity_points;
CREATE POLICY "User can read own demo equity points"
ON public.demo_equity_points
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access demo_accounts" ON public.demo_accounts;
CREATE POLICY "Service role full access demo_accounts"
ON public.demo_accounts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access demo_trades" ON public.demo_trades;
CREATE POLICY "Service role full access demo_trades"
ON public.demo_trades
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access demo_equity_points" ON public.demo_equity_points;
CREATE POLICY "Service role full access demo_equity_points"
ON public.demo_equity_points
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.ensure_demo_account(p_user_id UUID DEFAULT auth.uid())
RETURNS public.demo_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_row public.demo_accounts;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve user id for demo account';
  END IF;

  INSERT INTO public.demo_accounts (
    user_id,
    starting_capital,
    balance,
    equity,
    auto_trade_enabled,
    risk_model
  )
  VALUES (
    p_user_id,
    100000,
    100000,
    100000,
    true,
    '{"mode":"risk_percent","risk_percent":0.50}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO out_row
  FROM public.demo_accounts
  WHERE user_id = p_user_id;

  RETURN out_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_demo_account(p_user_id UUID DEFAULT auth.uid())
RETURNS public.demo_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_row public.demo_accounts;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve user id for demo reset';
  END IF;

  PERFORM public.ensure_demo_account(p_user_id);

  DELETE FROM public.demo_trades WHERE user_id = p_user_id;
  DELETE FROM public.demo_equity_points WHERE user_id = p_user_id;

  UPDATE public.demo_accounts
  SET
    starting_capital = 100000,
    balance = 100000,
    equity = 100000,
    auto_trade_enabled = true,
    risk_model = '{"mode":"risk_percent","risk_percent":0.50}'::jsonb
  WHERE user_id = p_user_id;

  INSERT INTO public.demo_equity_points (user_id, ts, balance, equity)
  VALUES (p_user_id, now(), 100000, 100000);

  SELECT * INTO out_row
  FROM public.demo_accounts
  WHERE user_id = p_user_id;

  RETURN out_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_demo_account(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_demo_account(UUID) TO authenticated, service_role;

