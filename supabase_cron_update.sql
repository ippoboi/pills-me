-- Update the existing Supabase cron job to run every 30 minutes instead of 15 minutes
-- This reduces server load while maintaining good notification coverage

-- First, check the current cron job and get its details
SELECT jobid, jobname, schedule, active, command 
FROM cron.job 
WHERE jobname = 'pillsme-send-reminders';

-- Method 1: Try to use cron.alter_job (if available in your pg_cron version)
-- SELECT cron.alter_job('pillsme-send-reminders', schedule := '*/30 * * * *');

-- Method 2: Alternative approach - unschedule and recreate (more compatible)
-- First, unschedule the existing job (replace JOBID with the actual job ID from the query above)
-- SELECT cron.unschedule(JOBID);

-- Then create a new job with 30-minute schedule
-- SELECT cron.schedule(
--   'pillsme-send-reminders',
--   '*/30 * * * *',  -- Every 30 minutes
--   $$
--   SELECT
--     net.http_post(
--       url := vault.get_secret('pillsme_vercel_url') || '/api/push/send?action=scheduled',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || vault.get_secret('pillsme_cron_secret')
--       ),
--       body := '{}'::jsonb
--     ) as request_id;
--   $$
-- );

-- Method 3: Direct UPDATE (if you have permissions)
-- UPDATE cron.job 
-- SET schedule = '*/30 * * * *' 
-- WHERE jobname = 'pillsme-send-reminders';

-- Verify the update
SELECT jobname, schedule, active, created_at, updated_at 
FROM cron.job 
WHERE jobname = 'pillsme-send-reminders';
