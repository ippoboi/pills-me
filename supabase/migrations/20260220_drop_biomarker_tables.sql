-- Drop biomarker-related tables (cleanup for planner feature)
-- These tables are being replaced by the nutrient planning system

BEGIN;

-- Drop in dependency order (children first)
DROP TABLE IF EXISTS raw_unmatched_data;
DROP TABLE IF EXISTS user_biomarkers;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS biomarker_synonyms;
DROP TABLE IF EXISTS biomarkers_information;
DROP TABLE IF EXISTS biomarker_categories;

-- Drop related enums
DROP TYPE IF EXISTS report_status;
DROP TYPE IF EXISTS unmatched_processing_status;
DROP TYPE IF EXISTS unmatched_resolution_action;

COMMIT;
