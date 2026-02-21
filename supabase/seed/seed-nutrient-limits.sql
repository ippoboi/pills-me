-- =============================================================================
-- Seed Script: Nutrient Limits Reference Data
-- =============================================================================
-- This script populates the nutrient_limits table with EFSA/IOM/clinical data.
-- Run AFTER seed-nutrients.sql (nutrients must exist first).
--
-- Sources:
-- - EFSA Dietary Reference Values (2023-2024)
-- - US IOM (fallback for nutrients without EFSA UL)
-- - Clinical studies for non-essential nutrients (TYPICAL_RANGE)
--
-- Usage:
--   npx supabase db execute -f supabase/seed/seed-nutrient-limits.sql
--   OR run via Supabase dashboard SQL editor
-- =============================================================================

BEGIN;

-- Clear existing limits to avoid duplicates
DELETE FROM nutrient_limits;

-- =============================================================================
-- VITAMIN A (mcg RAE) - EFSA 2024: UL 3000 mcg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 750, 3000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-a';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 650, 3000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-a';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'male', 750, 3000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-a';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'female', 650, 3000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-a';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 700, 3000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-a';

-- =============================================================================
-- VITAMIN D (mcg) - EFSA 2023: UL 100 mcg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 15, 100, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-d';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 15, 100, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-d';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 20, 100, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-d';

-- =============================================================================
-- VITAMIN E (mg) - EFSA 2024: UL 300 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 13, 300, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-e';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 11, 300, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-e';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 12, 300, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-e';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 12, 300, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-e';

-- =============================================================================
-- VITAMIN K (mcg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 70, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-k';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 70, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-k';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 70, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-k';

-- =============================================================================
-- VITAMIN C (mg) - No EFSA UL, IOM: 2000 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 110, 2000, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-c';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 95, 2000, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-c';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 100, 2000, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-c';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 100, 2000, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-c';

-- =============================================================================
-- VITAMIN B1 - THIAMINE (mg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 1.1, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b1';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 1.1, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b1';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 1.0, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b1';

-- =============================================================================
-- VITAMIN B2 - RIBOFLAVIN (mg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 1.6, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b2';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 1.6, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b2';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 1.6, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b2';

-- =============================================================================
-- VITAMIN B3 - NIACIN (mg) - IOM: 35 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 16, 35, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-b3';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 14, 35, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-b3';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 15, 35, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-b3';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 14, 35, 'mg', 'IOM' FROM nutrients WHERE slug = 'vitamin-b3';

-- =============================================================================
-- VITAMIN B5 - PANTOTHENIC ACID (mg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 5, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b5';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 5, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b5';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 5, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b5';

-- =============================================================================
-- VITAMIN B6 (mg) - EFSA 2023: UL 12.5 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 1.7, 12.5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b6';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 1.6, 12.5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b6';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 1.7, 12.5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b6';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 1.7, 12.5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b6';

-- =============================================================================
-- VITAMIN B7 - BIOTIN (mcg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 40, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b7';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 40, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b7';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 40, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b7';

-- =============================================================================
-- VITAMIN B9 - FOLATE (mcg) - EFSA: UL 1000 mcg (synthetic only)
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 330, 1000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b9';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 330, 1000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b9';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 330, 1000, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b9';

-- =============================================================================
-- VITAMIN B12 (mcg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 4, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b12';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 4, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b12';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 4, NULL, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'vitamin-b12';

-- =============================================================================
-- CALCIUM (mg) - EFSA: UL 2500 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 950, 2500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'calcium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 950, 2500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'calcium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 950, 2500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'calcium';

-- =============================================================================
-- MAGNESIUM (mg) - EFSA: UL 250 mg (supplements only)
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source, ul_context)
SELECT id, '18-50', 'male', 350, 250, 'mg', 'EFSA', 'supplements_only' FROM nutrients WHERE slug = 'magnesium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source, ul_context)
SELECT id, '18-50', 'female', 300, 250, 'mg', 'EFSA', 'supplements_only' FROM nutrients WHERE slug = 'magnesium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source, ul_context)
SELECT id, '51-70', 'all', 350, 250, 'mg', 'EFSA', 'supplements_only' FROM nutrients WHERE slug = 'magnesium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source, ul_context)
SELECT id, '71+', 'all', 350, 250, 'mg', 'EFSA', 'supplements_only' FROM nutrients WHERE slug = 'magnesium';

-- =============================================================================
-- POTASSIUM (mg) - No EFSA UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 3500, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'potassium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 3500, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'potassium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 3500, NULL, 'mg', 'EFSA' FROM nutrients WHERE slug = 'potassium';

-- =============================================================================
-- PHOSPHORUS (mg) - IOM: UL 4000 mg (3000 for 71+)
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 550, 4000, 'mg', 'IOM' FROM nutrients WHERE slug = 'phosphorus';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 550, 4000, 'mg', 'IOM' FROM nutrients WHERE slug = 'phosphorus';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 550, 3000, 'mg', 'IOM' FROM nutrients WHERE slug = 'phosphorus';

-- =============================================================================
-- IRON (mg) - No EFSA UL, safe level 25 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'male', 11, NULL, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'iron';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'female', 16, NULL, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'iron';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', 11, NULL, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'iron';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', 11, NULL, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'iron';

-- =============================================================================
-- ZINC (mg) - EFSA: UL 25 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 11, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'zinc';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 8, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'zinc';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 10, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'zinc';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 10, 25, 'mg', 'EFSA' FROM nutrients WHERE slug = 'zinc';

-- =============================================================================
-- SELENIUM (mcg) - EFSA 2023: UL 255 mcg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 70, 255, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'selenium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 70, 255, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'selenium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 70, 255, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'selenium';

-- =============================================================================
-- COPPER (mg) - EFSA: UL 5 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 1.6, 5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'copper';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 1.6, 5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'copper';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 1.3, 5, 'mg', 'EFSA' FROM nutrients WHERE slug = 'copper';

-- =============================================================================
-- MANGANESE (mg) - No EFSA UL, safe level 8 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', 3, NULL, 8, 'mg', 'EFSA' FROM nutrients WHERE slug = 'manganese';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', 3, NULL, 8, 'mg', 'EFSA' FROM nutrients WHERE slug = 'manganese';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', 3, NULL, 8, 'mg', 'EFSA' FROM nutrients WHERE slug = 'manganese';

-- =============================================================================
-- IODINE (mcg) - EFSA: UL 600 mcg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 150, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'iodine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 150, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'iodine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 150, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'iodine';

-- =============================================================================
-- CHROMIUM (mcg) - No EFSA DRV or UL
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'male', 35, NULL, 'mcg', 'IOM' FROM nutrients WHERE slug = 'chromium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'female', 25, NULL, 'mcg', 'IOM' FROM nutrients WHERE slug = 'chromium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 30, NULL, 'mcg', 'IOM' FROM nutrients WHERE slug = 'chromium';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 30, NULL, 'mcg', 'IOM' FROM nutrients WHERE slug = 'chromium';

-- =============================================================================
-- MOLYBDENUM (mcg) - EFSA: UL 600 mcg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 65, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'molybdenum';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 65, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'molybdenum';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 65, 600, 'mcg', 'EFSA' FROM nutrients WHERE slug = 'molybdenum';

-- =============================================================================
-- OMEGA-3 EPA+DHA COMBINED (mg) - EFSA: up to 5000 mg safe
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 250, 5000, 'mg', 'EFSA' FROM nutrients WHERE slug = 'omega-3-epa-dha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 250, 5000, 'mg', 'EFSA' FROM nutrients WHERE slug = 'omega-3-epa-dha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 250, 5000, 'mg', 'EFSA' FROM nutrients WHERE slug = 'omega-3-epa-dha';

-- =============================================================================
-- CHOLINE (mg) - EFSA: UL 3500 mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', 400, 3500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'choline';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', 400, 3500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'choline';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', 400, 3500, 'mg', 'EFSA' FROM nutrients WHERE slug = 'choline';

-- =============================================================================
-- CAFFEINE (mg) - EFSA: safe limit 400 mg/day
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '18-50', 'all', NULL, 400, 'mg', 'EFSA' FROM nutrients WHERE slug = 'caffeine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '51-70', 'all', NULL, 400, 'mg', 'EFSA' FROM nutrients WHERE slug = 'caffeine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, unit, source)
SELECT id, '71+', 'all', NULL, 400, 'mg', 'EFSA' FROM nutrients WHERE slug = 'caffeine';

-- =============================================================================
-- OMEGA-3 EPA (mg) - EFSA: EPA alone up to 1800 mg/day safe
-- Source: EFSA 2012 + clinical studies
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 1800, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-epa';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 1800, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-epa';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 1800, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-epa';

-- =============================================================================
-- OMEGA-3 DHA (mg) - EFSA 2026 + Denmark regulatory limit
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 1500, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-dha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 1500, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-dha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 1500, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-dha';

-- =============================================================================
-- OMEGA-3 ALA (mg) - IOM AI + clinical data
-- AI: 1.6g (men), 1.1g (women); doses >3-5g lack long-term safety data
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'male', 1600, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-ala';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'female', 1100, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-ala';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', 1350, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-ala';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', 1350, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'omega-3-ala';

-- =============================================================================
-- L-THEANINE (mg) - Clinical studies 200-900 mg/day well-tolerated
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-theanine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-theanine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 400, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-theanine';

-- =============================================================================
-- L-TYROSINE (mg) - Safe up to 150 mg/kg short-term; 500-1500 mg/day typical
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 2000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-tyrosine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 2000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-tyrosine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 1500, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-tyrosine';

-- =============================================================================
-- L-GLUTAMINE (mg) - FDA approved 30g/day; observed safe level 14g long-term
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 14000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-glutamine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 14000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-glutamine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 10000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'l-glutamine';

-- =============================================================================
-- TAURINE (mg) - EFSA safe level 6g/day; conservative 3g recommended
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'taurine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'taurine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 3000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'taurine';

-- =============================================================================
-- GLYCINE (mg) - Clinical studies 3-60g/day; typical therapeutic 3-10g
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 10000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'glycine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 10000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'glycine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 5000, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'glycine';

-- =============================================================================
-- MELATONIN (mg) - Optimal 0.5-5 mg; ≥10 mg studied without serious AEs
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 10, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'melatonin';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 10, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'melatonin';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 5, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'melatonin';

-- =============================================================================
-- COENZYME Q10 (mg) - ADI 12mg/kg/day (~720mg for 60kg); therapeutic 100-600mg
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'coq10';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'coq10';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'coq10';

-- =============================================================================
-- ASHWAGANDHA (mg) - Clinical studies 250-600 mg/day root extract
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'ashwagandha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 600, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'ashwagandha';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 450, 'mg', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'ashwagandha';

-- =============================================================================
-- COLLAGEN (g) - Clinical trials 2.5-15g/day typical; up to 60g studied
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 15, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'collagen';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 15, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'collagen';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 15, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'collagen';

-- =============================================================================
-- PROBIOTICS (billion CFU) - No established UL; 10-100 billion typical
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 100, 'billion CFU', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'probiotics';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 100, 'billion CFU', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'probiotics';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 50, 'billion CFU', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'probiotics';

-- =============================================================================
-- CREATINE (g) - ISSN: 3-5g/day maintenance; long-term safety proven
-- =============================================================================
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '18-50', 'all', NULL, NULL, 5, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'creatine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '51-70', 'all', NULL, NULL, 5, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'creatine';
INSERT INTO nutrient_limits (nutrient_id, age_group, sex, rda, upper_limit, safe_level, unit, source)
SELECT id, '71+', 'all', NULL, NULL, 5, 'g', 'TYPICAL_RANGE' FROM nutrients WHERE slug = 'creatine';

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT
--   n.name,
--   nl.age_group,
--   nl.sex,
--   nl.rda,
--   nl.upper_limit,
--   nl.safe_level,
--   nl.unit,
--   nl.source
-- FROM nutrient_limits nl
-- JOIN nutrients n ON nl.nutrient_id = n.id
-- ORDER BY n.name, nl.age_group, nl.sex;
