-- ============================================================================
-- EMERGENCY FIX: User Registration RLS
-- ============================================================================
-- Run this in Supabase SQL Editor to fix registration
-- ============================================================================

-- First, let's see what policies exist on users table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- ============================================================================
-- STEP 1: Drop ALL existing INSERT policies on users to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Owner can create users" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON public.users;

-- ============================================================================
-- STEP 2: Create a simple, permissive INSERT policy
-- ============================================================================

-- Allow any authenticated user to insert their own row
-- The key constraint is: id must match auth.uid()
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- ============================================================================
-- STEP 3: Verify the policy was created
-- ============================================================================

SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT';

-- ============================================================================
-- STEP 4: Also ensure activation_keys policies are correct
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can check activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "System can update activation keys" ON public.activation_keys;

-- Allow reading unused keys
CREATE POLICY "Anyone can check activation keys"
  ON public.activation_keys FOR SELECT
  USING (is_used = FALSE OR used_by = auth.uid());

-- Allow updating keys (for activation)
CREATE POLICY "System can update activation keys"
  ON public.activation_keys FOR UPDATE
  USING (TRUE);

-- ============================================================================
-- DONE - Now test registration in the React Native app
-- ============================================================================

SELECT 'RLS policies fixed! Try registering now.' AS status;
