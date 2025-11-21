-- ============================================================================
-- Migration: Admin Contribution Analytics
-- ============================================================================
-- This migration creates views and functions to track admin contributions
-- for payment calculations based on questions and resources added
-- ============================================================================

-- Step 1: Create view for admin contributions summary
CREATE OR REPLACE VIEW public.admin_contributions AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  COALESCE(q.question_count, 0) as questions_added,
  COALESCE(r.resource_count, 0) as resources_added,
  COALESCE(q.question_count, 0) + COALESCE(r.resource_count, 0) as total_contributions,
  GREATEST(q.last_question_date, r.last_resource_date) as last_contribution_date
FROM public.users u
LEFT JOIN (
  SELECT 
    created_by,
    COUNT(*) as question_count,
    MAX(created_at) as last_question_date
  FROM public.questions
  WHERE created_by IS NOT NULL
  GROUP BY created_by
) q ON u.id = q.created_by
LEFT JOIN (
  SELECT 
    created_by,
    COUNT(*) as resource_count,
    MAX(created_at) as last_resource_date
  FROM public.course_resources
  WHERE created_by IS NOT NULL
  GROUP BY created_by
) r ON u.id = r.created_by
WHERE u.role IN ('admin', 'manager', 'owner')
  AND (q.question_count > 0 OR r.resource_count > 0);

-- Step 2: Create function to get contributions by period
CREATE OR REPLACE FUNCTION public.get_admin_contributions_by_period(
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  questions_added BIGINT,
  resources_added BIGINT,
  total_contributions BIGINT,
  last_contribution_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    COALESCE(q.question_count, 0) as questions_added,
    COALESCE(r.resource_count, 0) as resources_added,
    COALESCE(q.question_count, 0) + COALESCE(r.resource_count, 0) as total_contributions,
    GREATEST(q.last_question_date, r.last_resource_date) as last_contribution_date
  FROM public.users u
  LEFT JOIN (
    SELECT 
      created_by,
      COUNT(*) as question_count,
      MAX(created_at) as last_question_date
    FROM public.questions
    WHERE created_by IS NOT NULL
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY created_by
  ) q ON u.id = q.created_by
  LEFT JOIN (
    SELECT 
      created_by,
      COUNT(*) as resource_count,
      MAX(created_at) as last_resource_date
    FROM public.course_resources
    WHERE created_by IS NOT NULL
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY created_by
  ) r ON u.id = r.created_by
  WHERE u.role IN ('admin', 'manager', 'owner')
    AND (q.question_count > 0 OR r.resource_count > 0)
  ORDER BY total_contributions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to get detailed breakdown per admin
CREATE OR REPLACE FUNCTION public.get_admin_contribution_details(
  admin_user_id UUID,
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
  content_type TEXT,
  year year_level,
  module_name TEXT,
  count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  
  -- Questions breakdown
  SELECT 
    'question'::TEXT as content_type,
    q.year,
    q.module_name,
    COUNT(*) as count,
    MAX(q.created_at) as created_at
  FROM public.questions q
  WHERE q.created_by = admin_user_id
    AND (start_date IS NULL OR q.created_at >= start_date)
    AND (end_date IS NULL OR q.created_at <= end_date)
  GROUP BY q.year, q.module_name
  
  UNION ALL
  
  -- Resources breakdown
  SELECT 
    'resource'::TEXT as content_type,
    r.year,
    r.module_name,
    COUNT(*) as count,
    MAX(r.created_at) as created_at
  FROM public.course_resources r
  WHERE r.created_by = admin_user_id
    AND (start_date IS NULL OR r.created_at >= start_date)
    AND (end_date IS NULL OR r.created_at <= end_date)
  GROUP BY r.year, r.module_name
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT SELECT ON public.admin_contributions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_contributions_by_period TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_contribution_details TO authenticated;

-- Step 5: Add comments for documentation
COMMENT ON VIEW public.admin_contributions IS 'Summary view of all admin contributions for payment calculations';
COMMENT ON FUNCTION public.get_admin_contributions_by_period IS 'Get admin contributions filtered by date range';
COMMENT ON FUNCTION public.get_admin_contribution_details IS 'Get detailed breakdown of contributions per admin by year and module';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Admin contribution analytics created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - View: admin_contributions';
  RAISE NOTICE '  - Function: get_admin_contributions_by_period()';
  RAISE NOTICE '  - Function: get_admin_contribution_details()';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  SELECT * FROM admin_contributions;';
  RAISE NOTICE '  SELECT * FROM get_admin_contributions_by_period(''2024-01-01'', ''2024-12-31'');';
  RAISE NOTICE '  SELECT * FROM get_admin_contribution_details(''user-uuid'');';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
