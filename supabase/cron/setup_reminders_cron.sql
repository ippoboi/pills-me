-- ============================================================================
-- PILLSME REMINDERS CRON JOB SETUP
-- ============================================================================
-- This script sets up the Supabase cron job for sending supplement reminders
-- based on per-user local timezones.
--
-- Prerequisites:
-- 1. pg_cron extension enabled
-- 2. pg_net extension enabled
-- 3. vault extension enabled
-- 4. Vault secrets created:
--    - pillsme_vercel_url (your Vercel deployment URL)
--    - pillsme_cron_secret (secure random string for authentication)
--
-- ============================================================================

-- First, check if the job already exists and remove it if needed
DO $$
DECLARE
  existing_job_id INTEGER;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'pillsme-send-reminders';
  
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
    RAISE NOTICE 'Unscheduled existing job with ID: %', existing_job_id;
  END IF;
END $$;

-- Create the cron job
-- Schedule: Every hour at minute 0 (0 * * * *)
-- This frequency ensures notifications are sent within the 15-minute window
-- Running hourly is more efficient than every 30 minutes while still catching all windows
SELECT cron.schedule(
  'pillsme-send-reminders',
  '0 * * * *',  -- Every hour at minute 0 (e.g., 8:00, 9:00, 10:00, etc.)
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pillsme_vercel_url') || '/api/push/send?action=scheduled',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pillsme_cron_secret')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the job was created
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  created_at
FROM cron.job
WHERE jobname = 'pillsme-send-reminders';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The cron job calls: GET /api/push/send?action=scheduled
-- 2. The endpoint processes per-user timezone-aware notifications
-- 3. Notification windows (local time):
--    - MORNING: 8:00 AM (15-minute window: 8:00-8:15)
--    - LUNCH: 12:00 PM (15-minute window: 12:00-12:15)
--    - DINNER: 6:00 PM (15-minute window: 18:00-18:15)
--    - BEFORE_SLEEP: 10:00 PM (15-minute window: 22:00-22:15)
-- 4. The endpoint only sends notifications for supplements that haven't been
--    taken yet today (based on supplement_adherence records)
-- ============================================================================

