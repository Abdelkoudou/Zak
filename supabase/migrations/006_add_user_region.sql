-- ============================================================================
-- Migration: Add region field to users table
-- ============================================================================
-- This migration adds the region (wilaya) field for Algerian users
-- ============================================================================

-- Add region column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Add speciality column if not exists (for mobile app registration)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS speciality TEXT 
CHECK (speciality IS NULL OR speciality IN ('Médecine', 'Pharmacie', 'Dentaire'));

-- Add year_of_study column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS year_of_study TEXT 
CHECK (year_of_study IS NULL OR year_of_study IN ('1', '2', '3'));

-- Create index for filtering by region
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);

-- Create index for filtering by year
CREATE INDEX IF NOT EXISTS idx_users_year ON public.users(year_of_study);

-- Create index for filtering by speciality
CREATE INDEX IF NOT EXISTS idx_users_speciality ON public.users(speciality);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check if columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'region'
  ) THEN
    RAISE NOTICE '✅ region column added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'speciality'
  ) THEN
    RAISE NOTICE '✅ speciality column added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'year_of_study'
  ) THEN
    RAISE NOTICE '✅ year_of_study column added successfully';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
