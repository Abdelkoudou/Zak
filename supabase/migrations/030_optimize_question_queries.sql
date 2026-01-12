-- ============================================================================
-- Migration: Optimize Question Query Performance
-- ============================================================================
-- Based on pg_stat_statements analysis showing slow queries:
-- 1. Questions with answers ordered by created_at, number (52.8% of time)
-- 2. Questions with answers ordered by number (12.7% of time)
-- 3. Questions filtered by module_name + cours (12% of time)
-- 4. Questions filtered by module_name only (5.7% of time)
-- 5. Questions filtered by year + module_name (2.3% of time)
-- 6. Questions filtered by module_name + exam_type (0.4% of time)
-- ============================================================================
-- NOTE: User already created idx_questions_created_at via Supabase UI button
-- This migration adds ADDITIONAL indexes for other slow query patterns
-- ============================================================================

-- ============================================================================
-- STEP 1: Create indexes that DON'T exist yet (using IF NOT EXISTS)
-- ============================================================================

-- For Query #1: ORDER BY created_at ASC, number ASC (most expensive - 52.8%)
-- The single created_at index helps but composite is better for this exact pattern
CREATE INDEX IF NOT EXISTS idx_questions_created_at_number 
  ON public.questions (created_at ASC, number ASC);

-- For Query #2: ORDER BY number ASC (12.7%)
CREATE INDEX IF NOT EXISTS idx_questions_number 
  ON public.questions (number ASC);

-- For Query #3: WHERE module_name = ? AND cours @> ? (12%)
CREATE INDEX IF NOT EXISTS idx_questions_module_name 
  ON public.questions (module_name);

-- GIN index for the array containment operator (@>)
CREATE INDEX IF NOT EXISTS idx_questions_cours_gin 
  ON public.questions USING GIN (cours);

-- For Query #5: WHERE year = ? AND module_name = ? ORDER BY created_at, number (4%)
CREATE INDEX IF NOT EXISTS idx_questions_year_module_created_at 
  ON public.questions (year, module_name, created_at ASC, number ASC);

-- For Query #6: WHERE module_name = ? AND exam_type = ? (0.4%)
CREATE INDEX IF NOT EXISTS idx_questions_module_exam_type 
  ON public.questions (module_name, exam_type);

-- For: WHERE year = ? ORDER BY number
CREATE INDEX IF NOT EXISTS idx_questions_year_number 
  ON public.questions (year, number ASC);

-- For: WHERE year = ? ORDER BY created_at, number
CREATE INDEX IF NOT EXISTS idx_questions_year_created_at_number
  ON public.questions (year, created_at ASC, number ASC);

-- ============================================================================
-- STEP 2: Ensure answers table has proper index for JOIN
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_answers_question_id 
  ON public.answers (question_id);

-- ============================================================================
-- STEP 3: Analyze tables to update statistics for query planner
-- ============================================================================
ANALYZE public.questions;
ANALYZE public.answers;

-- ============================================================================
-- Verification - List all indexes on questions table
-- ============================================================================
DO $$
DECLARE
  idx_record RECORD;
  idx_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Query optimization indexes created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All indexes on questions table:';
  
  FOR idx_record IN 
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'questions'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %', idx_record.indexname;
  END LOOP;
  
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename = 'questions';
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total indexes on questions: %', idx_count;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
