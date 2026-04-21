-- Signal Engine v2 schema expansion
-- Run in Supabase SQL editor

-- 1) Extend signals status enum/check support
ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS signals_status_check;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_status_check
  CHECK (status IN ('ACTIVE', 'HIT_TP1', 'HIT_TP2', 'HIT_TP3', 'HIT_SL', 'BREAKEVEN', 'EXPIRED', 'REJECTED'));

-- 2) Add new decision-engine columns
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS lane TEXT DEFAULT 'intraday';
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS score_total NUMERIC DEFAULT 0;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS rr_value NUMERIC DEFAULT 0;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS risk_percent_used NUMERIC DEFAULT 0;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS position_size NUMERIC DEFAULT 0;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS session_context TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS news_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS risk_context JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_signals_lane_created ON public.signals (lane, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_blocked_reason ON public.signals (blocked_reason);

-- 3) Daily risk state table (persistent guardrails)
CREATE TABLE IF NOT EXISTS public.risk_guard_state (
  trade_date DATE PRIMARY KEY,
  daily_loss_pct NUMERIC DEFAULT 0,
  consecutive_sl INT DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  halted_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.risk_guard_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on risk_guard_state" ON public.risk_guard_state;
CREATE POLICY "Allow public read on risk_guard_state"
  ON public.risk_guard_state FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service write on risk_guard_state" ON public.risk_guard_state;
CREATE POLICY "Allow service write on risk_guard_state"
  ON public.risk_guard_state FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
