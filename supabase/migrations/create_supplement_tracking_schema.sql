-- Create custom enum types for supplement tracking
CREATE TYPE supplement_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE time_of_day AS ENUM ('MORNING', 'LUNCH', 'DINNER', 'BEFORE_SLEEP');

-- ============================================================================
-- SUPPLEMENTS TABLE
-- ============================================================================
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  capsules_per_take INTEGER NOT NULL DEFAULT 1,
  recommendation VARCHAR(255),
  reason VARCHAR(255),
  source_name VARCHAR(255),
  source_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status supplement_status NOT NULL DEFAULT 'ACTIVE',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT capsules_per_take_positive CHECK (capsules_per_take > 0),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date)
);

-- Indexes for supplements table
CREATE INDEX idx_supplements_user_id ON supplements(user_id);
CREATE INDEX idx_supplements_status ON supplements(status);
CREATE INDEX idx_supplements_start_date ON supplements(start_date);
CREATE INDEX idx_supplements_deleted_at ON supplements(deleted_at);

-- Comments for supplements table
COMMENT ON TABLE supplements IS 'Stores user supplement information with tracking details';
COMMENT ON COLUMN supplements.capsules_per_take IS 'Global amount taken each time, applies to all times of day';
COMMENT ON COLUMN supplements.deleted_at IS 'Soft delete timestamp - preserves adherence history';
COMMENT ON COLUMN supplements.status IS 'Current status: ACTIVE (ongoing), COMPLETED (finished), CANCELLED (stopped early)';

-- ============================================================================
-- SUPPLEMENT SCHEDULES TABLE
-- ============================================================================
CREATE TABLE supplement_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  time_of_day time_of_day NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate times for same supplement
  CONSTRAINT unique_supplement_time UNIQUE (supplement_id, time_of_day)
);

-- Index for supplement_schedules table
CREATE INDEX idx_supplement_schedules_supplement_id ON supplement_schedules(supplement_id);

-- Comments for supplement_schedules table
COMMENT ON TABLE supplement_schedules IS 'Defines what times of day each supplement should be taken';
COMMENT ON COLUMN supplement_schedules.time_of_day IS 'When to take: MORNING, LUNCH, DINNER, or BEFORE_SLEEP';

-- ============================================================================
-- SUPPLEMENT ADHERENCE TABLE
-- ============================================================================
CREATE TABLE supplement_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  supplement_id UUID NOT NULL REFERENCES supplements(id),
  schedule_id UUID NOT NULL REFERENCES supplement_schedules(id),
  taken_at TIMESTAMPTZ NOT NULL, -- UTC timestamp for timezone-independent tracking
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  capsules_taken INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same dose
  CONSTRAINT unique_adherence_entry UNIQUE (supplement_id, schedule_id, taken_at)
);

-- Indexes for supplement_adherence table
CREATE INDEX idx_adherence_user_id ON supplement_adherence(user_id);
CREATE INDEX idx_adherence_supplement_id ON supplement_adherence(supplement_id);
CREATE INDEX idx_adherence_taken_at ON supplement_adherence(taken_at);
CREATE INDEX idx_adherence_user_supplement_date ON supplement_adherence(user_id, supplement_id, taken_at);

-- Comments for supplement_adherence table
COMMENT ON TABLE supplement_adherence IS 'Historical tracking of when users mark doses as taken';
COMMENT ON COLUMN supplement_adherence.taken_at IS 'The date this dose was for';
COMMENT ON COLUMN supplement_adherence.marked_at IS 'Timestamp when user checked off the dose';
COMMENT ON COLUMN supplement_adherence.capsules_taken IS 'Number of capsules taken - for future serving size tracking feature';

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_times JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index for user_preferences table
CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Comments for user_preferences table
COMMENT ON TABLE user_preferences IS 'User-specific settings for notifications and preferences';
COMMENT ON COLUMN user_preferences.reminder_times IS 'JSON object storing time preferences per time_of_day for notifications';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_adherence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplements table
CREATE POLICY "Users can view their own supplements"
  ON supplements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplements"
  ON supplements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplements"
  ON supplements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplements"
  ON supplements FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for supplement_schedules table
-- Users can access schedules through their supplements
CREATE POLICY "Users can view schedules for their supplements"
  ON supplement_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplements
      WHERE supplements.id = supplement_schedules.supplement_id
      AND supplements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedules for their supplements"
  ON supplement_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplements
      WHERE supplements.id = supplement_schedules.supplement_id
      AND supplements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules for their supplements"
  ON supplement_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM supplements
      WHERE supplements.id = supplement_schedules.supplement_id
      AND supplements.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules for their supplements"
  ON supplement_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM supplements
      WHERE supplements.id = supplement_schedules.supplement_id
      AND supplements.user_id = auth.uid()
    )
  );

-- RLS Policies for supplement_adherence table
CREATE POLICY "Users can view their own adherence records"
  ON supplement_adherence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adherence records"
  ON supplement_adherence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adherence records"
  ON supplement_adherence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adherence records"
  ON supplement_adherence FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_supplements_updated_at
  BEFORE UPDATE ON supplements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

