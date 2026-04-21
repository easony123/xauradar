-- Critical runtime/security hardening
-- 1) Ensure BREAKEVEN remains an allowed terminal signal status
-- 2) Restrict risk_guard_state writes to service_role only

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS signals_status_check;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_status_check
  CHECK (
    status IN (
      'ACTIVE',
      'HIT_TP1',
      'HIT_TP2',
      'HIT_TP3',
      'HIT_SL',
      'BREAKEVEN',
      'EXPIRED',
      'REJECTED'
    )
  );

ALTER TABLE public.risk_guard_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service write on risk_guard_state" ON public.risk_guard_state;
CREATE POLICY "Allow service write on risk_guard_state"
  ON public.risk_guard_state FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
