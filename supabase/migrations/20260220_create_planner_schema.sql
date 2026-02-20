-- Supplement Intake Planner schema
-- Normalized nutrient reference data with EFSA limits

BEGIN;

-- Plan status enum
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- ============================================================================
-- NUTRIENT CATEGORIES
-- ============================================================================
CREATE TABLE nutrient_categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);

COMMENT ON TABLE nutrient_categories IS 'Categories for nutrients (vitamins, minerals, fatty-acids, etc.)';

-- ============================================================================
-- NUTRIENTS MASTER TABLE
-- ============================================================================
CREATE TABLE nutrients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  category_id        TEXT REFERENCES nutrient_categories(id),
  default_unit       TEXT NOT NULL,
  alternate_unit     TEXT,
  conversion_factor  DECIMAL,
  description        TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nutrients_slug ON nutrients(slug);
CREATE INDEX idx_nutrients_category ON nutrients(category_id);

COMMENT ON TABLE nutrients IS 'Master table of all nutrients with unit information';
COMMENT ON COLUMN nutrients.slug IS 'URL-friendly identifier (e.g., vitamin-d, magnesium)';
COMMENT ON COLUMN nutrients.conversion_factor IS 'Factor to convert from alternate_unit to default_unit';

-- ============================================================================
-- NUTRIENT LIMITS BY AGE/SEX (EFSA DATA)
-- ============================================================================
CREATE TABLE nutrient_limits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrient_id  UUID NOT NULL REFERENCES nutrients(id) ON DELETE CASCADE,
  age_group    TEXT NOT NULL,
  sex          TEXT NOT NULL,
  rda          DECIMAL,
  upper_limit  DECIMAL,
  unit         TEXT NOT NULL,
  source       TEXT DEFAULT 'EFSA',

  UNIQUE(nutrient_id, age_group, sex, source)
);

CREATE INDEX idx_nutrient_limits_lookup ON nutrient_limits(nutrient_id, age_group, sex);

COMMENT ON TABLE nutrient_limits IS 'EFSA dietary reference values by age group and sex';
COMMENT ON COLUMN nutrient_limits.rda IS 'Recommended Daily Allowance (PRI/AI in EFSA terminology)';
COMMENT ON COLUMN nutrient_limits.upper_limit IS 'Maximum safe daily intake (NULL = no established limit)';

-- ============================================================================
-- SUPPLEMENT CATEGORIES
-- ============================================================================
CREATE TABLE supplement_categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);

COMMENT ON TABLE supplement_categories IS 'Categories for supplements (sleep, energy, immune, etc.)';

-- ============================================================================
-- SUPPLEMENT PLANS
-- ============================================================================
CREATE TABLE supplement_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT false,
  status      plan_status DEFAULT 'draft',
  start_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplement_plans_user ON supplement_plans(user_id);
CREATE INDEX idx_supplement_plans_status ON supplement_plans(user_id, status);

COMMENT ON TABLE supplement_plans IS 'User supplement plans (e.g., Daily Essentials, Winter Stack)';
COMMENT ON COLUMN supplement_plans.is_default IS 'True for auto-created default plan';
COMMENT ON COLUMN supplement_plans.status IS 'Plan lifecycle: draft -> active -> paused/archived';

-- RLS for plans
ALTER TABLE supplement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans" ON supplement_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PLAN ITEMS (BEFORE ACTIVATION)
-- ============================================================================
CREATE TABLE plan_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES supplement_plans(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  brand            TEXT,
  servings_per_day DECIMAL DEFAULT 1,
  nutrients        JSONB NOT NULL DEFAULT '[]',
  source_type      TEXT DEFAULT 'manual',
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plan_items_plan ON plan_items(plan_id);

COMMENT ON TABLE plan_items IS 'Supplements within a plan (before activation)';
COMMENT ON COLUMN plan_items.nutrients IS 'Array of {nutrientId, nutrientSlug, amount, unit}';
COMMENT ON COLUMN plan_items.source_type IS 'How item was added: manual, history, ai';

-- RLS for plan items (via plan ownership)
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in own plans" ON plan_items
  FOR ALL USING (
    plan_id IN (SELECT id FROM supplement_plans WHERE user_id = auth.uid())
  );

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Add columns to supplements table
ALTER TABLE supplements
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES supplement_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES supplement_categories(id);

-- Add birthdate to user_information table
ALTER TABLE user_information
ADD COLUMN IF NOT EXISTS birthdate DATE;

COMMENT ON COLUMN user_information.birthdate IS 'User birthdate for age-based nutrient limit calculation';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at for supplement_plans
CREATE TRIGGER update_supplement_plans_updated_at
  BEFORE UPDATE ON supplement_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
