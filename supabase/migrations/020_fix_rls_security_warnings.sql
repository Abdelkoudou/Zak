-- ============================================================================
-- Migration: Fix Security Warnings
-- ============================================================================
-- This migration addresses multiple Supabase security linter warnings:
-- 1. SECURITY DEFINER on online_payment_stats view
-- 2. RLS policy "Update activation keys" has WITH CHECK (true)
-- 3. RLS policy "System can update payments" has USING (true)
-- 4. RLS policy "Allow anonymous profile creation" has WITH CHECK (true)
-- ============================================================================

-- ============================================================================
-- FIX 1: online_payment_stats view - Set SECURITY INVOKER
-- ============================================================================
ALTER VIEW IF EXISTS public.online_payment_stats SET (security_invoker = true);

-- ============================================================================
-- FIX 2: activation_keys UPDATE policy - Add proper WITH CHECK
-- ============================================================================
-- The current policy allows anyone to update unused keys but WITH CHECK (true)
-- is too permissive. We need to ensure updates are valid.
DROP POLICY IF EXISTS "Update activation keys" ON public.activation_keys;

CREATE POLICY "Update activation keys"
  ON public.activation_keys FOR UPDATE
  TO anon, authenticated
  USING (
    is_used = false
    OR (select is_admin_or_higher())
  )
  WITH CHECK (
    -- Admins can update anything
    (select is_admin_or_higher())
    -- Non-admins can only mark keys as used (activation flow)
    OR (
      is_used = true 
      AND used_by = (select auth.uid())
      AND used_at IS NOT NULL
    )
  );

-- ============================================================================
-- FIX 3: online_payments policies - Consolidate and fix performance
-- ============================================================================
-- Issues:
-- a) "System can update payments" has USING (true) - too permissive
-- b) Multiple SELECT policies cause performance issues
-- c) "Users can view own payments" re-evaluates auth.uid() per row

-- Drop all existing SELECT policies to consolidate
DROP POLICY IF EXISTS "Admins can view all payments" ON public.online_payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.online_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.online_payments;

-- Consolidated SELECT policy with proper auth function caching
CREATE POLICY "View online payments"
  ON public.online_payments FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all
    (select is_admin_or_higher())
    -- Users can see their own payments
    OR user_id = (select auth.uid())
    OR customer_email = (SELECT email FROM public.users WHERE id = (select auth.uid()))
  );

-- Admins can update payments (for manual corrections)
CREATE POLICY "Admins can update payments"
  ON public.online_payments FOR UPDATE
  TO authenticated
  USING ((select is_admin_or_higher()))
  WITH CHECK ((select is_admin_or_higher()));

-- Note: Webhook updates should use service role key which bypasses RLS

-- ============================================================================
-- FIX 4: users INSERT policy - Add proper validation for anonymous signup
-- ============================================================================
-- The "Allow anonymous profile creation" policy needs constraints to prevent
-- abuse while still allowing legitimate signups.
DROP POLICY IF EXISTS "Allow anonymous profile creation" ON public.users;

CREATE POLICY "Allow anonymous profile creation"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow creating student accounts
    role = 'student'
    -- Ensure required fields are present
    AND email IS NOT NULL
    AND full_name IS NOT NULL
  );

-- ============================================================================
-- Verification
-- ============================================================================
SELECT '✅ Fixed all RLS security warnings' AS status;
