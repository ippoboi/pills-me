-- Add safe_level column to nutrient_limits
-- This column is used when an official UL cannot be established but
-- a safe level of intake has been determined from clinical studies.

BEGIN;

-- Add safe_level column
ALTER TABLE nutrient_limits
ADD COLUMN IF NOT EXISTS safe_level DECIMAL;

COMMENT ON COLUMN nutrient_limits.safe_level IS 'Safe level of intake when UL cannot be established (e.g., clinical study ranges)';

-- Add ul_context column for special context (e.g., supplements_only)
ALTER TABLE nutrient_limits
ADD COLUMN IF NOT EXISTS ul_context TEXT;

COMMENT ON COLUMN nutrient_limits.ul_context IS 'Special context for UL (e.g., supplements_only)';

COMMIT;
