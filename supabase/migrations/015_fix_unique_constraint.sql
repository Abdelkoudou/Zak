-- ============================================================================
-- Migration: Fix Questions Unique Constraint to Include exam_year
-- ============================================================================
-- Problem: The current unique constraint doesn't include exam_year, so questions
-- with the same number from different exam years (promos) conflict.
-- 
-- Current constraint: UNIQUE(year, module_name, sub_discipline, exam_type, number)
-- New constraint: UNIQUE(year, module_name, sub_discipline, exam_type, exam_year, number)
-- ============================================================================

-- Step 1: Drop the existing unique constraint
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_year_module_name_sub_discipline_exam_type_number_key;

-- Step 2: Create new unique constraint including exam_year
-- Note: We use COALESCE to handle NULL exam_year values (treating them as a single group)
-- This allows questions without exam_year to still be unique by number
ALTER TABLE public.questions
  ADD CONSTRAINT questions_unique_per_exam 
  UNIQUE(year, module_name, sub_discipline, exam_type, exam_year, number);

-- Step 3: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_unique_combo 
  ON public.questions(year, module_name, sub_discipline, exam_type, exam_year, number);

-- ============================================================================
-- Verification
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Unique constraint migration completed!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Old constraint: (year, module_name, sub_discipline, exam_type, number)';
  RAISE NOTICE 'New constraint: (year, module_name, sub_discipline, exam_type, exam_year, number)';
  RAISE NOTICE '';
  RAISE NOTICE 'Now questions from different exam years (promos) can have the same number.';
  RAISE NOTICE '============================================';
END $;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
