-- ============================================================================
-- COMPLETE LOGIN FIX - Run this entire script
-- ============================================================================

-- Step 1: Check if is_admin_or_higher() function exists
SELECT 
  'STEP 1: Function Check' as step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Function exists'
    ELSE '❌ Function MISSING'
  END as status
FROM pg_proc
WHERE proname = 'is_admin_or_higher';

-- Step 2: Create or replace the function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO anon;

-- Step 3: Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Step 4: Create new policy that works with login
CREATE POLICY "Users can view own profile and admins can view all"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    is_admin_or_higher()
  );

-- Step 5: Verify the policy was created
SELECT 
  'STEP 5: Policy Check' as step,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Step 6: Test if you can read your own user record
-- This simulates what happens during login
SELECT 
  'STEP 6: User Record Test' as step,
  id,
  email,
  role,
  is_paid,
  '✅ If you see this, the policy works!' as status
FROM public.users
WHERE email = 'qcmadin@gmail.com';

-- ============================================================================
-- If Step 6 shows your user record, the fix is complete! Try logging in now.
-- ============================================================================

-- ============================================================================
-- TROUBLESHOOTING: If Step 6 shows nothing, run this:
-- ============================================================================

-- Option A: More permissive policy (recommended)
-- DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
-- 
-- CREATE POLICY "Authenticated users can read users"
--   ON public.users
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Option B: Disable RLS temporarily (for testing only)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- -- Try logging in
-- -- If it works, re-enable:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
