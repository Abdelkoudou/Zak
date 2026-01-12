-- ============================================================================
-- Migration: Add Performance Indexes
-- ============================================================================
-- Problem: Query performance is slow when loading questions ordered by created_at.
-- Supabase advisor recommends adding an index on created_at for 81.85% improvement.
-- ============================================================================

-- Primary index recommended by Supabase advisor
-- This dramatically improves ORDER BY created_at queries
CREATE INDEX IF NOT EXISTS idx_questions_created_at 
  ON public.questions USING btree (created_at);

-- Composite index for common query pattern: filter by year, order by created_at
CREATE INDEX IF NOT EXISTS idx_questions_year_created_at 
  ON public.questions (year, created_at DESC);

-- Composite index for module filtering with ordering
CREATE INDEX IF NOT EXISTS idx_questions_module_created_at 
  ON public.questions (module_name, created_at DESC);

-- Index for answers lookup (foreign key)
CREATE INDEX IF NOT EXISTS idx_answers_question_id 
  ON public.answers (question_id);

-- ============================================================================
-- Analyze tables to update statistics for query planner
-- ============================================================================
ANALYZE public.questions;
ANALYZE public.answers;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes 
  WHERE tablename = 'questions' 
  AND schemaname = 'public';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Performance indexes added!';
  RAISE NOTICE 'Total indexes on questions table: %', idx_count;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
