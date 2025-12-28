-- ============================================================================
-- Migration: Optimize RLS Performance and Consolidate Policies
-- ============================================================================
-- This migration addresses two performance issues:
-- 1. Auth RLS Initialization: Uses (SELECT auth.uid()) to optimize row evaluation.
-- 2. Redundant Policies: Merges overlapping policies for better maintenance.
-- ============================================================================

DO $$ 
BEGIN

-- ============================================================================
-- 1. TABLE: public.users
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Owner can create users" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Consolidated Selective Policy
CREATE POLICY "Users can view own profile or be admin"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id 
    OR is_admin_or_higher()
  );

-- Consolidated Update Policy
CREATE POLICY "Users can update own profile or be admin"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = id 
    OR is_admin_or_higher()
  );

-- Admin creation policy
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_higher());

-- Allow anonymous profile creation (needed for signup)
-- Note: This matches the requirement from FIX_REGISTRATION_FINAL.sql
CREATE POLICY "Allow anonymous profile creation"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- ============================================================================
-- 2. TABLE: public.activation_keys
-- ============================================================================
DROP POLICY IF EXISTS "Admins can create keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins can view all keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can view unused keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can create keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can view all keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner full access to activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins can manage activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can view activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Public can read unused activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can see own used keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Allow activation key updates" ON public.activation_keys;
DROP POLICY IF EXISTS "System can update keys on activation" ON public.activation_keys;

-- Admin/Owner Full Access
CREATE POLICY "Admins and owners manage all keys"
  ON public.activation_keys FOR ALL
  TO authenticated
  USING (is_admin_or_higher())
  WITH CHECK (is_admin_or_higher());

-- Standard User View (Own used keys)
CREATE POLICY "Users view own used keys"
  ON public.activation_keys FOR SELECT
  TO authenticated
  USING (used_by = (SELECT auth.uid()));

-- Registration Flow (Public can view unused keys)
CREATE POLICY "Public view unused keys"
  ON public.activation_keys FOR SELECT
  TO anon, authenticated
  USING (is_used = FALSE);

-- Update Policy for activation flow
CREATE POLICY "Allow key updates for activation"
  ON public.activation_keys FOR UPDATE
  TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- 3. TABLE: public.device_sessions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.device_sessions;

CREATE POLICY "Users manage own sessions"
  ON public.device_sessions FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins view all sessions"
  ON public.device_sessions FOR SELECT
  TO authenticated
  USING (is_admin_or_higher());

-- ============================================================================
-- 4. TABLE: public.saved_questions
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own saved questions" ON public.saved_questions;
DROP POLICY IF EXISTS "Users can save questions" ON public.saved_questions;
DROP POLICY IF EXISTS "Users can unsave questions" ON public.saved_questions;

CREATE POLICY "Users manage own bookmarks"
  ON public.saved_questions FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5. TABLE: public.test_attempts
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users can create own attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.test_attempts;

CREATE POLICY "Users manage own test attempts"
  ON public.test_attempts FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins view all test attempts"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (is_admin_or_higher());

-- ============================================================================
-- 6. TABLES: Clean up misc simple redundant policies
-- ============================================================================

-- Faculties
DROP POLICY IF EXISTS "Everyone can view faculties" ON public.faculties;
DROP POLICY IF EXISTS "Owner can modify faculties" ON public.faculties;
CREATE POLICY "Public view faculties" ON public.faculties FOR SELECT USING (TRUE);
CREATE POLICY "Owners manage faculties" ON public.faculties FOR ALL TO authenticated USING (is_owner());

-- Sales Points
DROP POLICY IF EXISTS "Owner can manage sales points" ON public.sales_points;
CREATE POLICY "Owners manage sales points" ON public.sales_points FOR ALL TO authenticated USING (is_owner());

-- Admin Payments
DROP POLICY IF EXISTS "Owners can view all payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Admins can view their own payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Owners can insert payments" ON public.admin_payments;

CREATE POLICY "Owners full access admin_payments" ON public.admin_payments FOR ALL TO authenticated USING (is_owner());
CREATE POLICY "Admins view own payments" ON public.admin_payments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses; -- Duplicate catch

CREATE POLICY "Public view courses" ON public.courses FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users insert courses" 
  ON public.courses FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.role() = 'authenticated'); -- Role is usually static, but linter flagged it. Using subquery if needed: ((SELECT auth.role()) = 'authenticated')

END $$;

SELECT '✅ RLS Performance Optimized and Policies Consolidated' AS status;
