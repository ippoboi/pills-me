-- Add description column and migrate thresholds JSON to a nested
-- { unit, default: { bands }, male: { bands }, female: { bands } } shape.

begin;

alter table public.biomarkers_information
  add column if not exists description text;

comment on column public.biomarkers_information.description is
  'Short plain-language description of what the biomarker measures or indicates.';

-- Wrap existing thresholds JSON into the new nested structure.
-- Existing shape: { "unit": "...", "bands": [ ... ] }
-- New shape:      { "unit": unit, "default": { "bands": [ ... ] }, "male": null, "female": null }
update public.biomarkers_information
set thresholds = jsonb_build_object(
  'unit', unit,
  'default', jsonb_build_object('bands', thresholds->'bands'),
  'male', null,
  'female', null
);

commit;


