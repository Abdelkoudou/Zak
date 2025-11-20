-- ============================================================================
-- FIX RLS POLICIES FOR LOGIN
-- ============================================================================
-- The current RLS policies are blocking the login flow
-- This script fixes the policies to allow login while maintaining security
-- ============================================================================

-- Problem: Current policy only allows users to see their own profile
-- But during login, we need to check the user's role
-- Solution: Allow authenticated users to read their own user record

-- ============================================================================
-- Step 1: Drop the restrictive policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- ============================================================================
-- Step 2: Create a better policy for SELECT
-- ============================================================================

-- This policy allows:
-- 1. Users to view their own profile (auth.uid() = id)
-- 2. Admins to view all users (is_admin_or_higher())
CREATE POLICY "Users can view own profile and admins can view all"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id  -- User can see their own record
    OR 
    is_admin_or_higher()  -- Admins can see all users
  );

-- ============================================================================
-- Step 3: Verify the is_admin_or_higher() function exists
-- ============================================================================

-- Check if function exists
SELECT 
  'FUNCTION CHECK' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ is_admin_or_higher() function exists'
    ELSE '❌ is_admin_or_higher() function MISSING - THIS IS THE PROBLEM!'
  END as status
FROM pg_proc
WHERE proname = 'is_admin_or_higher';

-- ============================================================================
-- Step 4: Create the is_admin_or_higher() function if missing
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 5: Grant execute permission
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO anon;

-- ============================================================================
-- Step 6: Verify all policies
-- ============================================================================

SELECT 
  '✅ FINAL POLICY CHECK' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ============================================================================
-- Expected output:
-- ============================================================================
-- policyname: "Users can view own profile and admins can view all"
-- cmd: SELECT
-- qual: ((auth.uid() = id) OR is_admin_or_higher())
-- ============================================================================

-- ============================================================================
-- Step 7: Test the policy
-- ============================================================================

-- This should return your user record
SELECT 
  id,
  email,
  role,
  is_paid
FROM public.users
WHERE email = 'qcmadin@gmail.com';

-- If you see your user record, the policy is working! ✅
-- If you see nothing, there's still an issue ❌

-- ============================================================================
-- ALTERNATIVE FIX: Temporarily disable RLS for testing
-- ============================================================================
-- Only use this if the above doesn't work
-- This will help identify if RLS is the problem

-- Uncomment to disable RLS temporarily:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Try logging in now
-- If it works, RLS was the problem

-- Re-enable RLS:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NUCLEAR OPTION: Allow all authenticated users to read users table
-- ============================================================================
-- This is less secure but will definitely fix the login issue
-- Only use if the above solutions don't work

-- DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;

-- CREATE POLICY "Authenticated users can read users table"
--   ON public.users
--   FOR SELECT
--   TO authenticated
--   USING (true);  -- Allow all authenticated users to read

-- This allows any logged-in user to read the users table
-- It's less secure but necessary for the login flow to work

-- ============================================================================
