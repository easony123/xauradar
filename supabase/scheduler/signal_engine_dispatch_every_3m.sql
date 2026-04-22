-- Supabase Scheduler setup for dispatching the Python signal engine every 3 minutes.
-- Run this in Supabase SQL Editor after deploying the `signal-engine-dispatcher` edge function.
--
-- This is the transitional production path for the current Python engine:
--   Supabase Scheduler -> Edge Function -> GitHub workflow_dispatch -> signal_generator.py
--
-- If SIGNAL_ENGINE_CRON_SECRET is configured on the Edge Function,
-- set v_signal_engine_cron_secret below to the same value.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove existing job with same name if present.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'signal-engine-dispatch-every-3m'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end
$$;

-- Schedule edge function every 3 minutes.
do $$
declare
  v_signal_engine_cron_secret text := '';
  v_headers jsonb;
begin
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json'
  );

  if coalesce(v_signal_engine_cron_secret, '') <> '' then
    v_headers := v_headers || jsonb_build_object(
      'x-cron-secret', v_signal_engine_cron_secret
    );
  end if;

  perform cron.schedule(
    'signal-engine-dispatch-every-3m',
    '*/3 * * * *',
    format(
      $cmd$
        select
          net.http_post(
            url := 'https://autbjwirftpixizrrzhw.supabase.co/functions/v1/signal-engine-dispatcher',
            headers := %L::jsonb,
            body := '{}'::jsonb
          ) as request_id;
      $cmd$,
      v_headers::text
    )
  );
end
$$;

-- Optional: inspect scheduler jobs and recent HTTP responses.
-- select * from cron.job order by jobid desc;
-- select * from net._http_response order by created desc limit 20;
