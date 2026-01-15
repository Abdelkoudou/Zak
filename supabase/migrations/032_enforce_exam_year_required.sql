-- ============================================================================
-- Migration: Enforce exam_year as Required + Fix Unique Constraint
-- ============================================================================
-- This migration:
-- 1. Identifies existing duplicates with NULL exam_year
-- 2. Keeps only the most recent duplicate, deletes older ones
-- 3. Creates a proper unique constraint that prevents future duplicates
-- 4. Adds trigger to require exam_year for new questions
-- ============================================================================

-- Step 1: Show current duplicate situation
DO $$
DECLARE
  dup_count INTEGER;
  total_null INTEGER;
BEGIN
  -- Count questions with NULL exam_year
  SELECT COUNT(*) INTO total_null FROM public.questions WHERE exam_year IS NULL;
  
  -- Count duplicate groups
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT year, module_name, COALESCE(sub_discipline, ''), exam_type, number, COUNT(*) as cnt
    FROM public.questions
    WHERE exam_year IS NULL
    GROUP BY year, module_name, COALESCE(sub_discipline, ''), exam_type, number
    HAVING COUNT(*) > 1
  ) dups;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Pre-cleanup status:';
  RAISE NOTICE 'Questions with NULL exam_year: %', total_null;
  RAISE NOTICE 'Duplicate groups to clean: %', dup_count;
  RAISE NOTICE '============================================';
END $$;

-- Step 2: Delete duplicate questions (keep the most recent one)
-- This deletes older duplicates where exam_year is NULL
DELETE FROM public.questions q1
WHERE q1.exam_year IS NULL
  AND q1.id NOT IN (
    -- Keep the most recent question for each duplicate group
    SELECT DISTINCT ON (year, module_name, COALESCE(sub_discipline, ''), exam_type, number) id
    FROM public.questions
    WHERE exam_year IS NULL
    ORDER BY year, module_name, COALESCE(sub_discipline, ''), exam_type, number, created_at DESC
  );

-- Step 3: Show post-cleanup status
DO $$
DECLARE
  remaining_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_null FROM public.questions WHERE exam_year IS NULL;
  RAISE NOTICE 'After cleanup: % questions with NULL exam_year remain (no duplicates)', remaining_null;
END $$;

-- Step 4: Drop old constraint if exists
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_unique_per_exam;

DROP INDEX IF EXISTS idx_questions_unique_no_nulls;
DROP INDEX IF EXISTS idx_questions_unique_combo;

-- Step 5: Create unique index that treats NULL exam_year as 0
CREATE UNIQUE INDEX idx_questions_unique_no_nulls 
ON public.questions(
  year, 
  module_name, 
  COALESCE(sub_discipline, ''), 
  exam_type, 
  COALESCE(exam_year, 0),
  number
);

-- Step 6: Add trigger to enforce exam_year is required for NEW questions
CREATE OR REPLACE FUNCTION enforce_exam_year_required()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.exam_year IS NULL THEN
    RAISE EXCEPTION 'exam_year is required for new questions. Please specify the promo year.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_exam_year ON public.questions;

CREATE TRIGGER trigger_enforce_exam_year
  BEFORE INSERT ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_exam_year_required();

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  final_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO final_count FROM public.questions;
  SELECT COUNT(*) INTO null_count FROM public.questions WHERE exam_year IS NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Final question count: %', final_count;
  RAISE NOTICE 'Questions with NULL exam_year: %', null_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. Deleted duplicate questions (kept most recent)';
  RAISE NOTICE '2. Created unique index with COALESCE';
  RAISE NOTICE '3. Added trigger to require exam_year for new questions';
  RAISE NOTICE '';
  RAISE NOTICE 'Behavior going forward:';
  RAISE NOTICE '- New questions MUST have exam_year';
  RAISE NOTICE '- Same number allowed only if exam_year is different';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
