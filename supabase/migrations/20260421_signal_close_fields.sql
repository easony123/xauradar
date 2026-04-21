-- Signal lifecycle close metrics + monitor heartbeat fields

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS realized_r NUMERIC,
  ADD COLUMN IF NOT EXISTS monitor_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_signals_monitor_updated ON public.signals (monitor_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_closed_at ON public.signals (closed_at DESC);

UPDATE public.signals
SET monitor_updated_at = COALESCE(monitor_updated_at, created_at)
WHERE monitor_updated_at IS NULL;
