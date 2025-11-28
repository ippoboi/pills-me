-- Create user_information table to hold per-user metadata such as sex,
-- which is used to select sex-specific biomarker thresholds.

begin;

create table if not exists public.user_information (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sex text not null check (sex in ('male', 'female')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_information is
  'Per-user demographic or health profile metadata (currently only sex).';

comment on column public.user_information.user_id is
  'Foreign key to auth.users.id for this Supabase project.';

comment on column public.user_information.sex is
  'Biological sex used for sex-specific biomarker thresholds (\"male\" or \"female\").';

create unique index if not exists user_information_user_id_key
  on public.user_information(user_id);

alter table public.user_information enable row level security;

commit;


