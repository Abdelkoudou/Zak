-- ============================================================================
-- DEVELOPMENT ONLY: Disable RLS for Admin Interface
-- ============================================================================
-- ⚠️  WARNING: This is for development/admin interface only!
-- ⚠️  DO NOT run this in production with public access!
-- ============================================================================

-- Temporarily disable RLS on tables that the admin interface needs to modify
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on user-related tables for security
-- (These remain protected)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Verification query
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Enabled' 
    ELSE '🔓 RLS Disabled' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('questions', 'answers', 'course_resources', 'users', 'saved_questions')
ORDER BY tablename;

-- ============================================================================
-- TO RE-ENABLE RLS LATER (for production):
-- ============================================================================
/*
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- This allows the admin interface to work without authentication
-- Perfect for:
-- ✅ Development and testing
-- ✅ Admin-only interfaces
-- ✅ Internal tools
--
-- Before production deployment:
-- ❌ Re-enable RLS
-- ❌ Add proper authentication
-- ❌ Restrict access to admin users only
-- ============================================================================
