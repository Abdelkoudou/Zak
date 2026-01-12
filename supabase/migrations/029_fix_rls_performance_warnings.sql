-- ============================================================================
-- Migration: Fix RLS Performance Warnings
-- ============================================================================
-- Fixes:
-- 1. auth_rls_initplan: Wrap auth.uid() in (select auth.uid()) for caching
-- 2. multiple_permissive_policies: Consolidate duplicate policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix online_payments policies
-- ============================================================================
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all payments" ON public.online_payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.online_payments;
DROP POLICY IF EXISTS "View online payments" ON public.online_payments;
DROP POLICY IF EXISTS "Admins can create payments" ON public.online_payments;
DROP POLICY IF EXISTS "System can update payments" ON public.online_payments;
DROP POLICY IF EXISTS "Admins can update payments" ON public.online_payments;

-- Consolidated SELECT policy (combines admin and user view)
CREATE POLICY "View online payments"
  ON public.online_payments FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all
    (select is_admin_or_higher())
    -- Users can see their own payments by email
    OR customer_email = (SELECT email FROM public.users WHERE id = (select auth.uid()))
  );

-- INSERT policy for admins
CREATE POLICY "Admins create payments"
  ON public.online_payments FOR INSERT
  TO authenticated
  WITH CHECK ((select is_admin_or_higher()));

-- UPDATE policy for admins (webhooks use service role)
CREATE POLICY "Admins update payments"
  ON public.online_payments FOR UPDATE
  TO authenticated
  USING ((select is_admin_or_higher()))
  WITH CHECK ((select is_admin_or_higher()));

-- ============================================================================
-- STEP 2: Fix question_reports policies
-- ============================================================================
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create reports" ON public.question_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.question_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.question_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.question_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.question_reports;

-- Consolidated SELECT policy
CREATE POLICY "View question reports"
  ON public.question_reports FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own reports
    user_id = (select auth.uid())
    -- Admins can see all
    OR (select is_admin_or_higher())
  );

-- INSERT policy with proper auth caching
CREATE POLICY "Users create reports"
  ON public.question_reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE policy for admins
CREATE POLICY "Admins update reports"
  ON public.question_reports FOR UPDATE
  TO authenticated
  USING ((select is_admin_or_higher()));

-- DELETE policy for admins
CREATE POLICY "Admins delete reports"
  ON public.question_reports FOR DELETE
  TO authenticated
  USING ((select is_admin_or_higher()));

-- ============================================================================
-- STEP 3: Fix knowledge_base policies
-- ============================================================================
-- Drop all existing policies (including any duplicates)
DROP POLICY IF EXISTS "Anyone can view knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Owners can insert knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Owners can update knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Owners can delete knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Owners can manage knowledge base" ON public.knowledge_base;

-- Single SELECT policy for public read
CREATE POLICY "Public view knowledge base"
  ON public.knowledge_base FOR SELECT
  TO anon, authenticated
  USING (true);

-- Single INSERT policy for owners
CREATE POLICY "Owners insert knowledge base"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK ((select is_owner()));

-- Single UPDATE policy for owners
CREATE POLICY "Owners update knowledge base"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING ((select is_owner()));

-- Single DELETE policy for owners
CREATE POLICY "Owners delete knowledge base"
  ON public.knowledge_base FOR DELETE
  TO authenticated
  USING ((select is_owner()));

-- ============================================================================
-- STEP 4: Fix chat_logs UPDATE policies
-- ============================================================================
-- Drop duplicate UPDATE policies
DROP POLICY IF EXISTS "Users can rate own chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Users can update own chat logs" ON public.chat_logs;

-- Single consolidated UPDATE policy
CREATE POLICY "Users update own chat logs"
  ON public.chat_logs FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND tablename IN ('online_payments', 'question_reports', 'knowledge_base', 'chat_logs');
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ RLS performance warnings fixed!';
  RAISE NOTICE 'Total policies on affected tables: %', policy_count;
  RAISE NOTICE '- auth.uid() wrapped in (select ...) for caching';
  RAISE NOTICE '- Duplicate policies consolidated';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
