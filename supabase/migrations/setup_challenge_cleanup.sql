-- Setup automated cleanup for expired passkey challenges using pg_cron
-- This migration enables pg_cron extension and schedules regular cleanup

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function that removes expired passkey challenges
CREATE OR REPLACE FUNCTION cleanup_expired_passkey_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired challenges
    DELETE FROM passkey_challenges
    WHERE expires_at < NOW();
    
    -- Get count of deleted rows
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    RAISE LOG 'Cleaned up % expired passkey challenges at %', deleted_count, NOW();
    
    -- Also log to a custom table for monitoring (optional)
    -- You can uncomment this if you want to track cleanup history
    /*
    INSERT INTO cleanup_logs (operation, deleted_count, executed_at)
    VALUES ('passkey_challenges_cleanup', deleted_count, NOW());
    */
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log any errors that occur during cleanup
        RAISE LOG 'Error during passkey challenge cleanup: %', SQLERRM;
        -- Re-raise the exception to ensure it's visible
        RAISE;
END;
$$;

-- Grant execute permission to postgres role (required for pg_cron)
GRANT EXECUTE ON FUNCTION cleanup_expired_passkey_challenges() TO postgres;

-- Schedule the cleanup function to run every hour
-- This will remove expired challenges automatically
SELECT cron.schedule(
    'cleanup-expired-challenges',  -- job name
    '0 * * * *',                  -- cron expression: every hour at minute 0
    $$SELECT cleanup_expired_passkey_challenges();$$  -- SQL to execute
);

-- Optional: Create a table to track cleanup operations (uncomment if needed)
/*
CREATE TABLE IF NOT EXISTS cleanup_logs (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(100) NOT NULL,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE cleanup_logs IS 'Tracks automated cleanup operations for monitoring';
*/

-- Add comments for documentation
COMMENT ON FUNCTION cleanup_expired_passkey_challenges() IS 'Automated cleanup function for expired passkey challenges, scheduled to run hourly via pg_cron';

-- Verify the cron job was scheduled successfully
-- You can check this by running: SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-challenges';

-- Note: To manually run the cleanup function for testing:
-- SELECT cleanup_expired_passkey_challenges();

-- Note: To unschedule the job if needed:
-- SELECT cron.unschedule('cleanup-expired-challenges');
