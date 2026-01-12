-- ============================================================================
-- Migration: Fix is_admin_or_higher function
-- ============================================================================
-- Problem: Migration 017 incorrectly included 'manager' in is_admin_or_higher().
-- This gave managers admin-level access to operations they shouldn't have.
-- 
-- is_admin_or_higher() should only include: owner, admin
-- is_manager_or_higher() should include: owner, admin, manager
-- ============================================================================

-- Fix is_admin_or_higher to exclude 'manager'
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
    AND role IN ('owner', 'admin')  -- Fixed: removed 'manager'
  );
END;
$$;

-- Ensure is_manager_or_higher is correct (should include manager)
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

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Role check functions fixed!';
  RAISE NOTICE 'is_admin_or_higher: owner, admin';
  RAISE NOTICE 'is_manager_or_higher: owner, admin, manager';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
