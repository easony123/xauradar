-- Dual-lane live signal runtime + notifications + demo trade event ledger

-- Keep signal lifecycle compatible with current engine statuses.
ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS signals_status_check;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_status_check
  CHECK (status IN ('ACTIVE', 'HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'BREAKEVEN', 'EXPIRED', 'REJECTED'));

ALTER TABLE public.demo_trades
  DROP CONSTRAINT IF EXISTS demo_trades_status_check;

ALTER TABLE public.demo_trades
  ADD CONSTRAINT demo_trades_status_check
  CHECK (status IN ('OPEN', 'WIN', 'LOSS', 'BREAKEVEN', 'EXPIRED'));

CREATE TABLE IF NOT EXISTS public.signal_decision_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  market_price NUMERIC NOT NULL DEFAULT 0,
  intraday_decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  swing_decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.signal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  lane TEXT NOT NULL DEFAULT 'intraday',
  event_type TEXT NOT NULL,
  payload_hash TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT signal_notifications_unique_event UNIQUE (signal_id, event_type)
);

CREATE TABLE IF NOT EXISTS public.demo_trade_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trade_id UUID NOT NULL REFERENCES public.demo_trades(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lane TEXT NOT NULL DEFAULT 'intraday',
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'OPEN',
      'TP1_PARTIAL',
      'SL_TO_BREAKEVEN',
      'TP2',
      'TP3',
      'STOP_LOSS',
      'BREAKEVEN',
      'EXPIRED'
    )
  ),
  event_price NUMERIC NOT NULL,
  realized_size NUMERIC NOT NULL DEFAULT 0,
  remaining_size NUMERIC NOT NULL DEFAULT 0,
  pnl_usd NUMERIC NOT NULL DEFAULT 0,
  pnl_r NUMERIC NOT NULL DEFAULT 0,
  pnl_pips NUMERIC NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_signal_decision_runs_created ON public.signal_decision_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_notifications_signal_event ON public.signal_notifications (signal_id, event_type);
CREATE INDEX IF NOT EXISTS idx_demo_trade_events_trade_created ON public.demo_trade_events (trade_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_trade_events_user_created ON public.demo_trade_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_trade_events_signal_event ON public.demo_trade_events (signal_id, event_type, created_at DESC);

ALTER TABLE public.signal_decision_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_trade_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on signal_decision_runs" ON public.signal_decision_runs;
CREATE POLICY "Allow public read on signal_decision_runs"
  ON public.signal_decision_runs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service write on signal_decision_runs" ON public.signal_decision_runs;
CREATE POLICY "Allow service write on signal_decision_runs"
  ON public.signal_decision_runs FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access signal_notifications" ON public.signal_notifications;
CREATE POLICY "Service role full access signal_notifications"
  ON public.signal_notifications FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "User can read own demo trade events" ON public.demo_trade_events;
CREATE POLICY "User can read own demo trade events"
  ON public.demo_trade_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access demo_trade_events" ON public.demo_trade_events;
CREATE POLICY "Service role full access demo_trade_events"
  ON public.demo_trade_events FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_decision_runs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
