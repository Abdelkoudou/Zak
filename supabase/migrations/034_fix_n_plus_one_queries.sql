-- ============================================================================
-- Migration: Fix N+1 Query Performance Issues
-- ============================================================================
-- This migration creates optimized database functions to eliminate N+1 queries
-- that were causing performance issues with 1,500+ concurrent users.
--
-- Problems Fixed:
-- 1. getModulesWithCounts() - was making N+1 queries (1 for modules + N for counts)
-- 2. loadExamTypesWithCounts() - was making N queries for each exam type
-- 3. loadCoursWithCounts() - was making N queries for each cours
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Get modules with question counts in a single query
-- ============================================================================
-- Replaces: getModulesWithCounts() which made 27+ queries
-- Now: Single query with LEFT JOIN aggregation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_modules_with_question_counts(p_year public.year_level DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  year public.year_level,
  type public.module_type,
  exam_types public.exam_type[],
  has_sub_disciplines BOOLEAN,
  sub_disciplines JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  question_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.year,
    m.type,
    m.exam_types,
    m.has_sub_disciplines,
    m.sub_disciplines,
    m.created_at,
    m.updated_at,
    COALESCE(q.cnt, 0)::BIGINT as question_count
  FROM public.modules m
  LEFT JOIN (
    SELECT module_name, COUNT(*) as cnt
    FROM public.questions
    GROUP BY module_name
  ) q ON m.name = q.module_name
  WHERE p_year IS NULL OR m.year = p_year
  ORDER BY m.year, m.type, m.name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_modules_with_question_counts(public.year_level) TO authenticated;
GRANT EXECUTE ON FUNCTION get_modules_with_question_counts(public.year_level) TO anon;

-- ============================================================================
-- FUNCTION 2: Get exam types with question counts for a module
-- ============================================================================
-- Replaces: loadExamTypesWithCounts() which made N queries per exam type
-- Now: Single query with GROUP BY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_exam_types_with_counts(
  p_module_name TEXT,
  p_year public.year_level DEFAULT NULL
)
RETURNS TABLE (
  exam_type public.exam_type,
  question_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.exam_type,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  WHERE q.module_name = p_module_name
    AND (p_year IS NULL OR q.year = p_year)
  GROUP BY q.exam_type
  HAVING COUNT(*) > 0
  ORDER BY q.exam_type;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_exam_types_with_counts(TEXT, public.year_level) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_types_with_counts(TEXT, public.year_level) TO anon;

-- ============================================================================
-- FUNCTION 3: Get cours (chapters) with question counts for a module
-- ============================================================================
-- Replaces: loadCoursWithCounts() which made N queries per cours
-- Now: Single query using unnest and GROUP BY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cours_with_counts(p_module_name TEXT)
RETURNS TABLE (
  cours_name TEXT,
  question_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(q.cours) as cours_name,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  WHERE q.module_name = p_module_name
    AND q.cours IS NOT NULL
    AND array_length(q.cours, 1) > 0
  GROUP BY unnest(q.cours)
  HAVING COUNT(*) > 0
  ORDER BY unnest(q.cours);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_cours_with_counts(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cours_with_counts(TEXT) TO anon;

-- ============================================================================
-- FUNCTION 4: Get module details with all counts in one call
-- ============================================================================
-- This is a comprehensive function that returns everything needed for
-- the module detail screen in a single database round-trip
-- ============================================================================

CREATE OR REPLACE FUNCTION get_module_details(p_module_id UUID)
RETURNS TABLE (
  module_data JSONB,
  question_count BIGINT,
  exam_types_with_counts JSONB,
  cours_with_counts JSONB,
  sub_disciplines TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_name TEXT;
  v_module_year public.year_level;
BEGIN
  -- Get module info
  SELECT m.name, m.year INTO v_module_name, v_module_year
  FROM public.modules m
  WHERE m.id = p_module_id;
  
  IF v_module_name IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    -- Module data as JSONB
    (SELECT to_jsonb(m.*) FROM public.modules m WHERE m.id = p_module_id) as module_data,
    
    -- Total question count
    (SELECT COUNT(*)::BIGINT FROM public.questions q WHERE q.module_name = v_module_name) as question_count,
    
    -- Exam types with counts as JSONB array
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', et.exam_type, 'count', et.cnt)), '[]'::jsonb)
      FROM (
        SELECT q.exam_type, COUNT(*) as cnt
        FROM public.questions q
        WHERE q.module_name = v_module_name
        GROUP BY q.exam_type
        HAVING COUNT(*) > 0
        ORDER BY q.exam_type
      ) et
    ) as exam_types_with_counts,
    
    -- Cours with counts as JSONB array
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', c.cours_name, 'count', c.cnt)), '[]'::jsonb)
      FROM (
        SELECT unnest(q.cours) as cours_name, COUNT(*) as cnt
        FROM public.questions q
        WHERE q.module_name = v_module_name
          AND q.cours IS NOT NULL
          AND array_length(q.cours, 1) > 0
        GROUP BY unnest(q.cours)
        HAVING COUNT(*) > 0
        ORDER BY unnest(q.cours)
      ) c
    ) as cours_with_counts,
    
    -- Unique sub-disciplines
    (
      SELECT ARRAY(
        SELECT DISTINCT q.sub_discipline
        FROM public.questions q
        WHERE q.module_name = v_module_name
          AND q.sub_discipline IS NOT NULL
          AND q.sub_discipline != ''
        ORDER BY q.sub_discipline
      )
    ) as sub_disciplines;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_module_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_module_details(UUID) TO anon;

-- ============================================================================
-- FUNCTION 5: Get all question counts grouped by module (for admin dashboard)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_module_question_counts()
RETURNS TABLE (
  module_name TEXT,
  question_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.module_name,
    COUNT(*)::BIGINT as question_count
  FROM public.questions q
  GROUP BY q.module_name
  ORDER BY q.module_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_module_question_counts() TO authenticated;

-- ============================================================================
-- Add indexes to optimize the new functions
-- ============================================================================

-- Index for module_name lookups (B-tree for text)
CREATE INDEX IF NOT EXISTS idx_questions_module_name 
  ON public.questions (module_name);

-- GIN index for cours array queries (GIN works with arrays)
CREATE INDEX IF NOT EXISTS idx_questions_cours_gin 
  ON public.questions USING GIN (cours);

-- Composite index for exam_type grouping by module
CREATE INDEX IF NOT EXISTS idx_questions_module_exam_type
  ON public.questions (module_name, exam_type);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_modules_with_question_counts',
    'get_exam_types_with_counts',
    'get_cours_with_counts',
    'get_module_details',
    'get_all_module_question_counts'
  );
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ N+1 Query Fix Migration Complete!';
  RAISE NOTICE 'Functions created: %', func_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Performance improvements:';
  RAISE NOTICE '  - getModulesWithCounts: 27 queries → 1 query';
  RAISE NOTICE '  - loadExamTypesWithCounts: N queries → 1 query';
  RAISE NOTICE '  - loadCoursWithCounts: N queries → 1 query';
  RAISE NOTICE '  - Module detail page: ~30 queries → 1 query';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
