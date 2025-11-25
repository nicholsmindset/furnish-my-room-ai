-- =====================================================
-- SCHEDULED JOBS SETUP
-- =====================================================
-- This migration sets up scheduled jobs using pg_cron
--
-- IMPORTANT: pg_cron must be enabled first in Supabase Dashboard
-- Go to: Database > Extensions > Enable pg_cron
-- =====================================================

-- Enable pg_cron extension (if not already enabled)
-- Note: This may need to be done in the Supabase Dashboard first
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- Job 1: Monthly Credit Reset
-- Runs on the 1st of every month at 00:00 UTC
-- Resets credits for all users based on their tier
-- =====================================================
SELECT cron.schedule(
  'monthly-credit-reset',
  '0 0 1 * *',  -- At 00:00 on day 1 of every month
  $$SELECT public.reset_monthly_credits()$$
);

-- =====================================================
-- Job 2: Daily Expiring Subscription Check
-- Runs daily at 09:00 UTC
-- Calls edge function to send reminder emails
-- =====================================================
-- Note: This requires the net extension for HTTP calls
-- Alternatively, set up an external cron service to call the edge function

-- For Supabase, we can use pg_net to call the edge function
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the expiring subscriptions edge function
CREATE OR REPLACE FUNCTION public.check_expiring_subscriptions_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  anon_key text;
BEGIN
  -- Get configuration from environment or set defaults
  -- Note: These need to be set via Supabase Dashboard > Vault
  supabase_url := current_setting('app.supabase_url', true);
  anon_key := current_setting('app.supabase_anon_key', true);

  -- If settings are not available, skip
  IF supabase_url IS NULL OR anon_key IS NULL THEN
    RAISE NOTICE 'Supabase URL or anon key not configured. Skipping expiring subscriptions check.';
    RETURN;
  END IF;

  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/check-expiring-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the daily expiring subscriptions check
-- Runs at 09:00 UTC every day
SELECT cron.schedule(
  'daily-expiring-subscriptions-check',
  '0 9 * * *',  -- At 09:00 every day
  $$SELECT public.check_expiring_subscriptions_job()$$
);

-- =====================================================
-- View scheduled jobs
-- =====================================================
-- To view scheduled jobs, run:
-- SELECT * FROM cron.job;
--
-- To view job run history, run:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- To unschedule a job, run:
-- SELECT cron.unschedule('job-name');
-- =====================================================

-- Add comment for documentation
COMMENT ON FUNCTION public.check_expiring_subscriptions_job() IS
'Scheduled job to check for expiring subscriptions and send reminder emails. Calls the check-expiring-subscriptions edge function.';
