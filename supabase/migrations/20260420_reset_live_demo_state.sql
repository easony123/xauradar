-- Reset live app state while keeping only the newest ACTIVE signal.

CREATE OR REPLACE FUNCTION public.reset_live_demo_state(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  keep_signal public.signals%ROWTYPE;
  account_row public.demo_accounts%ROWTYPE;
  risk_percent NUMERIC := 0.50;
  stop_distance NUMERIC := 0;
  position_size NUMERIC := 0;
  opened_trade_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve user id for live reset';
  END IF;

  SELECT *
  INTO keep_signal
  FROM public.signals
  WHERE status = 'ACTIVE'
  ORDER BY created_at DESC
  LIMIT 1;

  IF keep_signal.id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'NO_ACTIVE_SIGNAL'
    );
  END IF;

  PERFORM public.ensure_demo_account(p_user_id);

  DELETE FROM public.demo_trade_events WHERE user_id = p_user_id;
  DELETE FROM public.demo_trades WHERE user_id = p_user_id;
  DELETE FROM public.demo_equity_points WHERE user_id = p_user_id;

  DELETE FROM public.signals
  WHERE id <> keep_signal.id;

  DELETE FROM public.risk_guard_state;

  UPDATE public.demo_accounts
  SET
    starting_capital = 100000,
    balance = 100000,
    equity = 100000
  WHERE user_id = p_user_id
  RETURNING *
  INTO account_row;

  INSERT INTO public.demo_equity_points (user_id, ts, balance, equity)
  VALUES (p_user_id, now(), 100000, 100000);

  IF account_row.auto_trade_enabled
    AND COALESCE(keep_signal.entry_price, 0) > 0
    AND COALESCE(keep_signal.sl, 0) > 0 THEN
    BEGIN
      risk_percent := GREATEST(
        COALESCE(NULLIF(account_row.risk_model->>'risk_percent', '')::NUMERIC, keep_signal.risk_percent_used, 0.50),
        0.01
      );
    EXCEPTION
      WHEN OTHERS THEN
        risk_percent := GREATEST(COALESCE(keep_signal.risk_percent_used, 0.50), 0.01);
    END;

    stop_distance := GREATEST(ABS(COALESCE(keep_signal.entry_price, 0) - COALESCE(keep_signal.sl, 0)), 0.0001);
    position_size := (account_row.balance * risk_percent / 100.0) / stop_distance;

    INSERT INTO public.demo_trades (
      user_id,
      signal_id,
      lane,
      side,
      status,
      entry,
      sl,
      tp1,
      tp2,
      tp3,
      opened_at,
      risk_percent_used,
      position_size,
      metadata
    )
    VALUES (
      p_user_id,
      keep_signal.id,
      COALESCE(keep_signal.lane, 'intraday'),
      COALESCE(keep_signal.type, 'BUY'),
      'OPEN',
      COALESCE(keep_signal.entry_price, 0),
      COALESCE(keep_signal.sl, 0),
      COALESCE(keep_signal.tp1, 0),
      COALESCE(keep_signal.tp2, 0),
      COALESCE(keep_signal.tp3, 0),
      now(),
      risk_percent,
      ROUND(position_size, 6),
      jsonb_build_object(
        'source', 'reset_live_demo_state',
        'orig_sl', ROUND(COALESCE(keep_signal.sl, 0), 6),
        'initial_position_size', ROUND(position_size, 6),
        'remaining_position_size', ROUND(position_size, 6),
        'tp1_fraction', 0.50,
        'tp1_partial_done', false,
        'realized_pnl_usd', 0.0,
        'realized_pnl_r', 0.0,
        'realized_pnl_pips', 0.0,
        'partial_fills', '[]'::jsonb
      )
    )
    RETURNING id INTO opened_trade_id;

    INSERT INTO public.demo_trade_events (
      trade_id,
      signal_id,
      user_id,
      lane,
      event_type,
      event_price,
      realized_size,
      remaining_size,
      pnl_usd,
      pnl_r,
      pnl_pips,
      meta
    )
    VALUES (
      opened_trade_id,
      keep_signal.id,
      p_user_id,
      COALESCE(keep_signal.lane, 'intraday'),
      'OPEN',
      COALESCE(keep_signal.entry_price, 0),
      0,
      ROUND(position_size, 6),
      0,
      0,
      0,
      jsonb_build_object('side', COALESCE(keep_signal.type, 'BUY'))
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'kept_signal_id', keep_signal.id,
    'kept_signal_lane', keep_signal.lane,
    'recreated_demo_trade', opened_trade_id IS NOT NULL,
    'auto_trade_enabled', account_row.auto_trade_enabled
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_live_demo_state(UUID) TO authenticated, service_role;
