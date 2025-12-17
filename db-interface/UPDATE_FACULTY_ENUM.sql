-- Add new values to faculty_source enum
-- Run these commands in your Supabase SQL Editor

ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_biskra';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_oum_el_bouaghi';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_khenchela';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_souk_ahras';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_bechar';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_laghouat';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_ouargla';
