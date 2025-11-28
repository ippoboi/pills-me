-- ============================================================================
-- BIOMARKERS INFORMATION TABLE
-- Canonical biomarker definitions
-- ============================================================================
CREATE TABLE biomarkers_information (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,   -- e.g. "Alanine aminotransferase"
  short_name  text NOT NULL,          -- e.g. "ALT"
  slug        text NOT NULL UNIQUE,   -- e.g. "alt"
  unit        text NOT NULL,          -- canonical unit, e.g. "U/L"
  -- Threshold bands / interpretation, in canonical unit
  -- Example shape:
  -- {
  --   "unit": "U/L",
  --   "bands": [
  --     { "name": "low", "min": null, "max": 30, "status": "out_of_range" },
  --     { "name": "optimal", "min": 30, "max": 50, "status": "optimal" },
  --     { "name": "borderline_high", "min": 50, "max": 80, "status": "borderline" },
  --     { "name": "high", "min": 80, "max": null, "status": "out_of_range" }
  --   ]
  -- }
  thresholds  jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX biomarkers_information_slug_idx
  ON biomarkers_information (slug);

-- Optional trigram index for fuzzy search on canonical name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX biomarkers_information_name_trgm_idx
  ON biomarkers_information
  USING gin (name gin_trgm_ops);

-- Comments for biomarkers_information table
COMMENT ON TABLE biomarkers_information IS 'Canonical biomarker definitions with threshold bands for interpretation';
COMMENT ON COLUMN biomarkers_information.name IS 'Full canonical name of the biomarker';
COMMENT ON COLUMN biomarkers_information.short_name IS 'Abbreviated name (e.g. ALT, AST)';
COMMENT ON COLUMN biomarkers_information.slug IS 'URL-friendly identifier for the biomarker';
COMMENT ON COLUMN biomarkers_information.unit IS 'Canonical unit of measurement';
COMMENT ON COLUMN biomarkers_information.thresholds IS 'JSON object containing threshold bands for interpretation';

-- ============================================================================
-- BIOMARKER SYNONYMS TABLE
-- Synonyms / label variants for fuzzy matching
-- ============================================================================
CREATE TABLE biomarker_synonyms (
  id            bigserial PRIMARY KEY,
  biomarker_id  uuid NOT NULL
    REFERENCES biomarkers_information(id)
    ON DELETE CASCADE,
  synonym       text NOT NULL,  -- e.g. "TRANSAMINASE SGPT", "SGPT (ALT)"
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (biomarker_id, synonym)
);

CREATE INDEX biomarker_synonyms_synonym_trgm_idx
  ON biomarker_synonyms
  USING gin (synonym gin_trgm_ops);

CREATE INDEX biomarker_synonyms_biomarker_id_idx
  ON biomarker_synonyms (biomarker_id);

-- Comments for biomarker_synonyms table
COMMENT ON TABLE biomarker_synonyms IS 'Alternative names and labels for biomarkers to enable fuzzy matching';
COMMENT ON COLUMN biomarker_synonyms.synonym IS 'Alternative name or label variant for the biomarker';

-- ============================================================================
-- REPORTS TABLE
-- Logical report entity: one blood test report uploaded / entered by user
-- ============================================================================
CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  report_name     text NOT NULL,      -- user-given name in UI, e.g. "Checkup March 2025"
  -- Single timestamp for collection datetime; UI can let user pick date & time
  collected_at    timestamptz,        -- nullable if user doesn't know exact time
  lab_name        text,               -- optional free-text, e.g. "Bangkok Hospital"
  country         text,               -- e.g. "FR"
  timezone_id     text,               -- e.g. "Europe/Paris" (IANA zone)
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_user_id_idx ON reports (user_id);
CREATE INDEX reports_collected_at_idx ON reports (collected_at);

-- Comments for reports table
COMMENT ON TABLE reports IS 'Blood test reports uploaded or entered by users';
COMMENT ON COLUMN reports.report_name IS 'User-given name for the report in the UI';
COMMENT ON COLUMN reports.collected_at IS 'Timestamp when the blood sample was collected';
COMMENT ON COLUMN reports.lab_name IS 'Name of the laboratory that performed the test';

-- ============================================================================
-- USER BIOMARKERS TABLE
-- Individual biomarker values from user reports
-- ============================================================================
CREATE TABLE user_biomarkers (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  biomarker_id  uuid NOT NULL
    REFERENCES biomarkers_information(id),
  report_id     uuid
    REFERENCES reports(id)
    ON DELETE SET NULL,
  -- Value from the report, ideally normalized to biomarkers_information.unit
  value_numeric double precision,     -- e.g. 42.0
  value_text    text,                 -- e.g. ">150" when numeric is ambiguous
  measured_at   timestamptz,          -- often same as reports.collected_at, but
                                      -- you can override per-value if needed
  -- Debug / provenance
  raw_name      text,                 -- original OCR label as seen on PDF
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_biomarkers_value_check
    CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL)
);

CREATE INDEX user_biomarkers_user_id_idx
  ON user_biomarkers (user_id);
CREATE INDEX user_biomarkers_biomarker_id_idx
  ON user_biomarkers (biomarker_id);
CREATE INDEX user_biomarkers_report_id_idx
  ON user_biomarkers (report_id);
CREATE INDEX user_biomarkers_measured_at_idx
  ON user_biomarkers (measured_at);

-- Comments for user_biomarkers table
COMMENT ON TABLE user_biomarkers IS 'Individual biomarker values from user blood test reports';
COMMENT ON COLUMN user_biomarkers.value_numeric IS 'Numeric value of the biomarker, normalized to canonical unit';
COMMENT ON COLUMN user_biomarkers.value_text IS 'Text value for non-numeric results (e.g. ">150", "<5")';
COMMENT ON COLUMN user_biomarkers.measured_at IS 'Timestamp when the biomarker was measured (may differ from report collection time)';
COMMENT ON COLUMN user_biomarkers.raw_name IS 'Original label/name as extracted from OCR or user input';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE biomarkers_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_biomarkers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for biomarkers_information table
-- Public read access for canonical biomarker definitions
CREATE POLICY "Anyone can view biomarker information"
  ON biomarkers_information FOR SELECT
  USING (true);

-- RLS Policies for biomarker_synonyms table
-- Public read access for synonyms
CREATE POLICY "Anyone can view biomarker synonyms"
  ON biomarker_synonyms FOR SELECT
  USING (true);

-- RLS Policies for reports table
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_biomarkers table
CREATE POLICY "Users can view their own biomarker values"
  ON user_biomarkers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biomarker values"
  ON user_biomarkers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biomarker values"
  ON user_biomarkers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biomarker values"
  ON user_biomarkers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Trigger to automatically update updated_at for biomarkers_information
CREATE TRIGGER update_biomarkers_information_updated_at
  BEFORE UPDATE ON biomarkers_information
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

