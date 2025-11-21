-- ============================================================================
-- Migration: Add Exam Year/Promo Field
-- ============================================================================
-- This migration adds an exam_year field to track which year/promo the exam
-- was taken:
-- - 1ère année: 2018-2025
-- - 2ème année: 2018-2024
-- - 3ème année: 2018-2023
-- ============================================================================

-- Step 1: Add exam_year column to questions table
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS exam_year INTEGER;

-- Step 2: Add check constraint based on year level
ALTER TABLE public.questions
  ADD CONSTRAINT check_exam_year_range 
  CHECK (
    exam_year IS NULL OR (
      (year = '1' AND exam_year BETWEEN 2018 AND 2025) OR
      (year = '2' AND exam_year BETWEEN 2018 AND 2024) OR
      (year = '3' AND exam_year BETWEEN 2018 AND 2023)
    )
  );

-- Step 3: Add index for exam_year
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON public.questions(exam_year);

-- Step 4: Add composite index for common queries (year + exam_year)
CREATE INDEX IF NOT EXISTS idx_questions_year_exam_year ON public.questions(year, exam_year);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.questions.exam_year IS 'Year when the exam was taken (promo year). Valid ranges: 1ère année (2018-2025), 2ème année (2018-2024), 3ème année (2018-2023)';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  total_questions INTEGER;
  questions_with_exam_year INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_questions FROM public.questions;
  SELECT COUNT(*) INTO questions_with_exam_year FROM public.questions WHERE exam_year IS NOT NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Exam Year migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total questions: %', total_questions;
  RAISE NOTICE 'Questions with exam_year: %', questions_with_exam_year;
  RAISE NOTICE '';
  RAISE NOTICE 'New column added:';
  RAISE NOTICE '  - exam_year (INTEGER with range validation)';
  RAISE NOTICE '';
  RAISE NOTICE 'Valid ranges:';
  RAISE NOTICE '  - 1ère année: 2018-2025';
  RAISE NOTICE '  - 2ème année: 2018-2024';
  RAISE NOTICE '  - 3ème année: 2018-2023';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
