-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  supplement_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  refill_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  app_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  system_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_times JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index for notification_preferences table
CREATE UNIQUE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Comments for notification_preferences table
COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences and settings';
COMMENT ON COLUMN notification_preferences.supplement_reminders_enabled IS 'Enable/disable supplement reminder notifications';
COMMENT ON COLUMN notification_preferences.refill_reminders_enabled IS 'Enable/disable refill reminder notifications';
COMMENT ON COLUMN notification_preferences.app_updates_enabled IS 'Enable/disable new updates notification';
COMMENT ON COLUMN notification_preferences.system_notifications_enabled IS 'Enable/disable system/app notifications';
COMMENT ON COLUMN notification_preferences.reminder_times IS 'JSON object storing custom reminder times per time_of_day';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on notification_preferences table
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Trigger to automatically update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
