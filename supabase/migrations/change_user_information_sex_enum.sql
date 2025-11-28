-- Change user_information.sex from text with a check constraint
-- to a dedicated enum type for stronger typing.

begin;

-- Create enum type if it doesn't already exist.
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_sex'
  ) then
    create type public.user_sex as enum ('male', 'female');
  end if;
end$$;

-- Drop the old check constraint if it exists so we can change type cleanly.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_information'::regclass
      and contype = 'c'
      and conname like '%sex%'
  ) then
    alter table public.user_information
      drop constraint if exists user_information_sex_check;
  end if;
end$$;

-- Convert column to enum type using existing text values.
alter table public.user_information
  alter column sex type public.user_sex
  using sex::public.user_sex;

comment on type public.user_sex is
  'Enum representing biological sex for user_information (male or female).';

commit;


