-- Add sub_discipline column to courses table
alter table public.courses add column sub_discipline text;

-- Update the unique constraint to include sub_discipline
-- First drop the old constraint
alter table public.courses drop constraint courses_name_year_speciality_module_name_key;

-- Add the new constraint
-- Using unique(name, year, speciality, module_name, sub_discipline)
-- We'll also update existing records if needed, but for now let's just apply the new constraint.
alter table public.courses add unique(name, year, speciality, module_name, sub_discipline);
