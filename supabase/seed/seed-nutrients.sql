-- =============================================================================
-- Seed Script: Nutrient Reference Data
-- =============================================================================
-- This script populates the nutrient reference tables with EFSA data.
-- Run after the planner schema migration.
--
-- Sources:
-- - EFSA Dietary Reference Values (2023-2024)
-- - US IOM (fallback for nutrients without EFSA UL)
--
-- Usage:
--   npx supabase db execute -f supabase/seed/seed-nutrients.sql
--   OR run via Supabase dashboard SQL editor
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. NUTRIENT CATEGORIES
-- =============================================================================

INSERT INTO nutrient_categories (id, label, sort_order) VALUES
  ('vitamins', 'Vitamins', 1),
  ('minerals', 'Minerals', 2),
  ('fatty-acids', 'Fatty Acids', 3),
  ('amino-acids', 'Amino Acids', 4),
  ('other', 'Other', 5)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 2. SUPPLEMENT CATEGORIES
-- =============================================================================

INSERT INTO supplement_categories (id, label, sort_order) VALUES
  ('general', 'General Health', 1),
  ('sleep', 'Sleep Support', 2),
  ('energy', 'Energy', 3),
  ('immune', 'Immune Health', 4),
  ('cognitive', 'Cognitive', 5),
  ('joint', 'Joint Health', 6),
  ('heart', 'Heart Health', 7),
  ('digestive', 'Digestive', 8),
  ('skin', 'Skin & Beauty', 9),
  ('fitness', 'Fitness & Recovery', 10)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 3. NUTRIENTS
-- =============================================================================

-- Clear existing nutrients (optional, remove if you want to preserve existing)
-- DELETE FROM nutrients;

-- Fat-Soluble Vitamins
INSERT INTO nutrients (name, slug, category_id, default_unit, alternate_unit, conversion_factor, description) VALUES
  ('Vitamin A', 'vitamin-a', 'vitamins', 'mcg', 'IU', 0.3, 'Retinol Activity Equivalents (RAE)'),
  ('Vitamin D', 'vitamin-d', 'vitamins', 'mcg', 'IU', 0.025, 'Cholecalciferol (D3) or Ergocalciferol (D2)'),
  ('Vitamin E', 'vitamin-e', 'vitamins', 'mg', 'IU', 0.67, 'Alpha-tocopherol'),
  ('Vitamin K', 'vitamin-k', 'vitamins', 'mcg', NULL, NULL, 'Phylloquinone (K1) and Menaquinones (K2)')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  alternate_unit = EXCLUDED.alternate_unit,
  conversion_factor = EXCLUDED.conversion_factor,
  description = EXCLUDED.description;

-- Water-Soluble Vitamins (B-complex)
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('Vitamin B1 (Thiamine)', 'vitamin-b1', 'vitamins', 'mg', NULL),
  ('Vitamin B2 (Riboflavin)', 'vitamin-b2', 'vitamins', 'mg', NULL),
  ('Vitamin B3 (Niacin)', 'vitamin-b3', 'vitamins', 'mg', 'Niacin Equivalents (NE)'),
  ('Vitamin B5 (Pantothenic Acid)', 'vitamin-b5', 'vitamins', 'mg', NULL),
  ('Vitamin B6', 'vitamin-b6', 'vitamins', 'mg', 'Pyridoxine'),
  ('Vitamin B7 (Biotin)', 'vitamin-b7', 'vitamins', 'mcg', NULL),
  ('Vitamin B9 (Folate)', 'vitamin-b9', 'vitamins', 'mcg', 'Dietary Folate Equivalents (DFE)'),
  ('Vitamin B12', 'vitamin-b12', 'vitamins', 'mcg', 'Cobalamin'),
  ('Vitamin C', 'vitamin-c', 'vitamins', 'mg', 'Ascorbic Acid')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- Macro Minerals
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('Calcium', 'calcium', 'minerals', 'mg', NULL),
  ('Magnesium', 'magnesium', 'minerals', 'mg', 'UL (250mg) applies to supplements only'),
  ('Potassium', 'potassium', 'minerals', 'mg', NULL),
  ('Phosphorus', 'phosphorus', 'minerals', 'mg', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- Trace Minerals
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('Iron', 'iron', 'minerals', 'mg', 'No EFSA UL. Safe supplemental level: ~25mg'),
  ('Zinc', 'zinc', 'minerals', 'mg', NULL),
  ('Selenium', 'selenium', 'minerals', 'mcg', NULL),
  ('Copper', 'copper', 'minerals', 'mg', NULL),
  ('Manganese', 'manganese', 'minerals', 'mg', 'No EFSA UL. Safe level: 8mg'),
  ('Iodine', 'iodine', 'minerals', 'mcg', NULL),
  ('Chromium', 'chromium', 'minerals', 'mcg', 'No EFSA DRV established'),
  ('Molybdenum', 'molybdenum', 'minerals', 'mcg', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- Fatty Acids
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('Omega-3 (EPA)', 'omega-3-epa', 'fatty-acids', 'mg', 'Eicosapentaenoic acid'),
  ('Omega-3 (DHA)', 'omega-3-dha', 'fatty-acids', 'mg', 'Docosahexaenoic acid'),
  ('Omega-3 (ALA)', 'omega-3-ala', 'fatty-acids', 'mg', 'Alpha-linolenic acid (essential)'),
  ('Omega-3 (Combined EPA+DHA)', 'omega-3-epa-dha', 'fatty-acids', 'mg', 'Combined EPA and DHA. EFSA AI: 250mg/day')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- Amino Acids
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('L-Theanine', 'l-theanine', 'amino-acids', 'mg', 'Amino acid found in tea'),
  ('L-Tyrosine', 'l-tyrosine', 'amino-acids', 'mg', 'Precursor to dopamine'),
  ('L-Glutamine', 'l-glutamine', 'amino-acids', 'mg', NULL),
  ('Taurine', 'taurine', 'amino-acids', 'mg', 'Conditionally essential'),
  ('Glycine', 'glycine', 'amino-acids', 'mg', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- Other Nutrients
INSERT INTO nutrients (name, slug, category_id, default_unit, description) VALUES
  ('Melatonin', 'melatonin', 'other', 'mg', 'Sleep hormone. Typical: 0.5-5mg'),
  ('Coenzyme Q10', 'coq10', 'other', 'mg', 'Ubiquinone. Typical: 30-200mg'),
  ('Ashwagandha', 'ashwagandha', 'other', 'mg', 'Adaptogenic herb. Typical: 300-600mg'),
  ('Collagen', 'collagen', 'other', 'g', 'Hydrolyzed peptides. Typical: 2.5-15g'),
  ('Probiotics', 'probiotics', 'other', 'CFU', 'Typical: 1-100 billion CFU'),
  ('Creatine', 'creatine', 'other', 'g', 'Creatine monohydrate. Typical: 3-5g'),
  ('Caffeine', 'caffeine', 'other', 'mg', 'EFSA safe limit: 400mg/day'),
  ('Choline', 'choline', 'other', 'mg', 'Essential nutrient. EFSA AI: 400mg')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  default_unit = EXCLUDED.default_unit,
  description = EXCLUDED.description;

-- =============================================================================
-- 4. NUTRIENT LIMITS (EFSA + IOM fallback)
-- =============================================================================
-- Note: Limits are inserted via TypeScript seeding script for type safety.
-- This section provides a reference for manual insertion if needed.
--
-- The nutrient_limits table requires nutrient_id (UUID), which must be looked
-- up from the nutrients table after insertion.
--
-- Run the TypeScript seeder instead:
--   npx ts-node lib/data/seed-limits.ts
-- =============================================================================

-- Example of how to insert limits (requires nutrient_id lookup):
--
-- INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
-- SELECT
--   n.id,
--   '18-50',
--   'male',
--   750,
--   3000,
--   'mcg',
--   'EFSA'
-- FROM nutrients n
-- WHERE n.slug = 'vitamin-a'
-- ON CONFLICT (nutrient_id, age_group, sex, source) DO UPDATE SET
--   rda = EXCLUDED.rda,
--   upper_limit = EXCLUDED.upper_limit;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these after seeding to verify data:
--
-- SELECT * FROM nutrient_categories ORDER BY sort_order;
-- SELECT * FROM supplement_categories ORDER BY sort_order;
-- SELECT n.name, n.slug, nc.label as category, n.default_unit
--   FROM nutrients n
--   JOIN nutrient_categories nc ON n.category_id = nc.id
--   ORDER BY nc.sort_order, n.name;
-- =============================================================================
