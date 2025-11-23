-- Add timezone column to notification_preferences table
-- This allows each user to have their own local timezone for notifications
ALTER TABLE notification_preferences 
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';

-- Add comment explaining the column
COMMENT ON COLUMN notification_preferences.timezone IS 'User timezone in IANA format (e.g. "Asia/Bangkok", "America/New_York") for local-time notifications';

-- Add constraint to ensure timezone is not empty
ALTER TABLE notification_preferences 
ADD CONSTRAINT timezone_not_empty CHECK (timezone != '');
