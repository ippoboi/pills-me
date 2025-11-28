-- Migration: Add UNMATCHED status to report_status enum
-- This allows reports with unmatched biomarker data to be flagged for user review

-- Add UNMATCHED value to the report_status enum
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'UNMATCHED';

