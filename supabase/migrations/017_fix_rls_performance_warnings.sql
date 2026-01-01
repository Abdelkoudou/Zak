-- ============================================================================
-- Migration: Fix RLS Performance Warnings
-- ============================================================================
-- Addresses Supabase linter warnings:
-- 1. auth_rls_initplan: Wrap auth functions in (select ...) for caching
-- 2. multiple_permissive_policies: Consolidate overlapping policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Update helper functions to use (select auth.uid()) internally
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role = 'owner'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_higher()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_paid_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid())
    AND is_paid = TRUE
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$;

-- ============================================================================
-- STEP 2: Fix courses policy (auth_rls_initplan warning)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users insert courses" ON public.courses;
CREATE POLICY "Authenticated users insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.role()) = 'authenticated');

-- ============================================================================
-- STEP 3: Consolidate activation_keys policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins and owners manage all keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Public view unused keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users view own used keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Allow key updates for activation" ON public.activation_keys;
DROP POLICY IF EXISTS "View activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins manage activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Allow key activation updates" ON public.activation_keys;
DROP POLICY IF EXISTS "Update activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins insert activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins delete activation keys" ON public.activation_keys;

CREATE POLICY "View activation keys"
  ON public.activation_keys FOR SELECT
  TO anon, authenticated
  USING (
    is_used = false
    OR used_by = (select auth.uid())
    OR (select is_admin_or_higher())
  );

CREATE POLICY "Update activation keys"
  ON public.activation_keys FOR UPDATE
  TO anon, authenticated
  USING (
    is_used = false
    OR (select is_admin_or_higher())
  )
  WITH CHECK (true);

CREATE POLICY "Admins insert activation keys"
  ON public.activation_keys FOR INSERT
  TO authenticated
  WITH CHECK ((select is_admin_or_higher()));

CREATE POLICY "Admins delete activation keys"
  ON public.activation_keys FOR DELETE
  TO authenticated
  USING ((select is_admin_or_higher()));


-- ============================================================================
-- STEP 4: Consolidate admin_payments policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins view own payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Owners full access admin_payments" ON public.admin_payments;
DROP POLICY IF EXISTS "View admin payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Owners manage admin payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Owners update admin payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Owners delete admin payments" ON public.admin_payments;

CREATE POLICY "View admin payments"
  ON public.admin_payments FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select is_owner())
  );

CREATE POLICY "Owners manage admin payments"
  ON public.admin_payments FOR INSERT
  TO authenticated
  WITH CHECK ((select is_owner()));

CREATE POLICY "Owners update admin payments"
  ON public.admin_payments FOR UPDATE
  TO authenticated
  USING ((select is_owner()));

CREATE POLICY "Owners delete admin payments"
  ON public.admin_payments FOR DELETE
  TO authenticated
  USING ((select is_owner()));

-- ============================================================================
-- STEP 5: Consolidate device_sessions policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins view all sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users manage own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "View device sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users delete own sessions" ON public.device_sessions;

CREATE POLICY "View device sessions"
  ON public.device_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select is_admin_or_higher())
  );

CREATE POLICY "Users manage own sessions"
  ON public.device_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users update own sessions"
  ON public.device_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users delete own sessions"
  ON public.device_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- STEP 6: Fix faculties policies
-- ============================================================================

DROP POLICY IF EXISTS "Owners manage faculties" ON public.faculties;
DROP POLICY IF EXISTS "Public view faculties" ON public.faculties;
DROP POLICY IF EXISTS "View faculties" ON public.faculties;
DROP POLICY IF EXISTS "Owners insert faculties" ON public.faculties;
DROP POLICY IF EXISTS "Owners update faculties" ON public.faculties;
DROP POLICY IF EXISTS "Owners delete faculties" ON public.faculties;

CREATE POLICY "View faculties"
  ON public.faculties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners insert faculties"
  ON public.faculties FOR INSERT
  TO authenticated
  WITH CHECK ((select is_owner()));

CREATE POLICY "Owners update faculties"
  ON public.faculties FOR UPDATE
  TO authenticated
  USING ((select is_owner()));

CREATE POLICY "Owners delete faculties"
  ON public.faculties FOR DELETE
  TO authenticated
  USING ((select is_owner()));

-- ============================================================================
-- STEP 7: Fix modules policies
-- ============================================================================

DROP POLICY IF EXISTS "Everyone can view modules" ON public.modules;
DROP POLICY IF EXISTS "Only owner can modify modules" ON public.modules;
DROP POLICY IF EXISTS "View modules" ON public.modules;
DROP POLICY IF EXISTS "Owners insert modules" ON public.modules;
DROP POLICY IF EXISTS "Owners update modules" ON public.modules;
DROP POLICY IF EXISTS "Owners delete modules" ON public.modules;

CREATE POLICY "View modules"
  ON public.modules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Owners insert modules"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK ((select is_owner()));

CREATE POLICY "Owners update modules"
  ON public.modules FOR UPDATE
  TO authenticated
  USING ((select is_owner()));

CREATE POLICY "Owners delete modules"
  ON public.modules FOR DELETE
  TO authenticated
  USING ((select is_owner()));

-- ============================================================================
-- STEP 8: Consolidate test_attempts policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins view all test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users manage own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "View test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users insert own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users update own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users delete own test attempts" ON public.test_attempts;

CREATE POLICY "View test attempts"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select is_admin_or_higher())
  );

CREATE POLICY "Users insert own test attempts"
  ON public.test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users update own test attempts"
  ON public.test_attempts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users delete own test attempts"
  ON public.test_attempts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- STEP 9: Add indexes for unindexed foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activation_keys_created_by 
  ON public.activation_keys(created_by);

CREATE INDEX IF NOT EXISTS idx_activation_keys_used_by 
  ON public.activation_keys(used_by);

CREATE INDEX IF NOT EXISTS idx_admin_payments_created_by 
  ON public.admin_payments(created_by);

CREATE INDEX IF NOT EXISTS idx_admin_payments_user_id 
  ON public.admin_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_points_created_by 
  ON public.sales_points(created_by);
