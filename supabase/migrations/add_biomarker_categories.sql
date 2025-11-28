-- ============================================================================
-- BIOMARKER CATEGORIES TABLE
-- Categories for organizing biomarkers (e.g. Cardiovascular, Metabolism)
-- ============================================================================
CREATE TABLE biomarker_categories (
  id          text PRIMARY KEY,      -- stable key, e.g. 'cardio', 'metabolism'
  label       text NOT NULL,         -- display name, e.g. "Cardiovascular"
  description text,
  sort_order  int  NOT NULL,         -- for consistent UI ordering
  icon        text                   -- optional: icon key / name
);

-- Comments for biomarker_categories table
COMMENT ON TABLE biomarker_categories IS 'Categories for organizing biomarkers into logical groups';
COMMENT ON COLUMN biomarker_categories.id IS 'Stable identifier key for the category';
COMMENT ON COLUMN biomarker_categories.label IS 'Display name for the category';
COMMENT ON COLUMN biomarker_categories.sort_order IS 'Numeric order for consistent UI sorting';
COMMENT ON COLUMN biomarker_categories.icon IS 'Optional icon identifier for UI display';

-- ============================================================================
-- SEED INITIAL CATEGORIES
-- ============================================================================

INSERT INTO biomarker_categories (id, label, description, sort_order, icon) VALUES
  ('cardio',        'Cardiovascular', 'Heart and vascular health biomarkers', 10, 'heart'),
  ('metabolism',    'Metabolism',     'Glucose, insulin, lipid and energy metabolism', 20, 'activity'),
  ('hormonal',      'Hormonal',       'Endocrine and sex hormone markers', 30, 'sparkles'),
  ('organ',         'Organ function', 'Liver, kidney and other organ function markers', 40, 'organ'),
  ('blood_immune',  'Blood & Immune', 'CBC and immune cell markers', 50, 'droplet'),
  ('nutritional',   'Nutritional',    'Vitamins, minerals and nutrient status', 60, 'leaf'),
  ('inflammation',  'Inflammation',   'Systemic and local inflammation markers', 70, 'flame'),
  ('environmental', 'Environmental',  'Exposure or toxin-related markers', 80, 'globe'),
  ('genetic',       'Genetic',        'Genetic and hereditary risk markers', 90, 'dna'),
  ('cancer',        'Cancer',         'Tumor and cancer-related markers', 100, 'ribbon');

-- ============================================================================
-- ADD CATEGORY_ID TO BIOMARKERS_INFORMATION
-- ============================================================================

-- Add category_id column (nullable initially)
ALTER TABLE biomarkers_information
  ADD COLUMN category_id text;

-- Set a default category for any existing rows
UPDATE biomarkers_information
SET category_id = 'metabolism'
WHERE category_id IS NULL;

-- Now enforce NOT NULL and add foreign key constraint
ALTER TABLE biomarkers_information
  ALTER COLUMN category_id SET NOT NULL,
  ADD CONSTRAINT biomarkers_information_category_fk
    FOREIGN KEY (category_id)
    REFERENCES biomarker_categories(id);

-- Helpful index for queries by category
CREATE INDEX biomarkers_information_category_id_idx
  ON biomarkers_information (category_id);

-- Comment for the new column
COMMENT ON COLUMN biomarkers_information.category_id IS 'Category this biomarker belongs to';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on biomarker_categories table
ALTER TABLE biomarker_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for biomarker_categories table
-- Public read access for categories (same as biomarkers_information)
CREATE POLICY "Anyone can view biomarker categories"
  ON biomarker_categories FOR SELECT
  USING (true);

