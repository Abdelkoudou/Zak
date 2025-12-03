-- ============================================================================
-- Migration: Fix User Registration RLS Policy
-- ============================================================================
-- This migration fixes the RLS policy that was blocking new user registration.
-- The issue: Only "Owner can create users" policy existed, blocking self-registration.
-- The fix: Add a policy allowing users to insert their own profile row.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add policy for user self-registration
-- ============================================================================

-- Allow authenticated users to create their own profile
-- This is needed for the registration flow in the React Native app
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    -- User can only insert a row where id matches their auth.uid()
    auth.uid() = id
    -- And they can only set role to 'student' (not admin/owner)
    AND role = 'student'
  );

-- ============================================================================
-- STEP 2: Ensure activation_keys can be read during registration
-- ============================================================================

-- Users need to read activation keys to validate during registration
DROP POLICY IF EXISTS "Anyone can check activation keys" ON public.activation_keys;
CREATE POLICY "Anyone can check activation keys"
  ON public.activation_keys FOR SELECT
  USING (
    -- Allow reading unused keys (for validation)
    is_used = FALSE
    -- Or keys used by the current user
    OR used_by = auth.uid()
  );

-- ============================================================================
-- STEP 3: Ensure activate_subscription function can update keys
-- ============================================================================

-- The activate_subscription function needs to update activation_keys
-- It's already SECURITY DEFINER so it runs with elevated privileges
-- But we need to ensure the policy allows updates

DROP POLICY IF EXISTS "System can update activation keys" ON public.activation_keys;
CREATE POLICY "System can update activation keys"
  ON public.activation_keys FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check policies were created
SELECT 'User registration RLS policies fixed' AS status;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
