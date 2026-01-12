-- ============================================================================
-- Migration: Expand faculty_source enum with specific annexes
-- ============================================================================
-- Problem: The original faculty_source enum only had 'fac_mere' and 'annexe'.
-- The UI allows selecting specific annexes like 'annexe_biskra', 'annexe_souk_ahras', etc.
-- This causes database errors when managers try to save questions with specific annexes.
-- ============================================================================

-- Add new values to faculty_source enum
-- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block in some cases
-- These are idempotent (IF NOT EXISTS)

ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_biskra';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_oum_el_bouaghi';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_khenchela';
ALTER TYPE faculty_source ADD VALUE IF NOT EXISTS 'annexe_souk_ahras';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  enum_values TEXT;
BEGIN
  SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'faculty_source'::regtype;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Faculty source enum updated!';
  RAISE NOTICE 'Current values: %', enum_values;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
