-- ============================================================================
-- Migration: Fix Function Search Paths
-- ============================================================================
-- This migration addresses Supabase linter warnings by hardcoding the 
-- search_path to 'public' for all custom functions. This prevents 
-- search-path hijacking attacks.
-- ============================================================================

-- 1. RLS Helper Functions
ALTER FUNCTION public.is_owner() SET search_path = public;
ALTER FUNCTION public.is_admin_or_higher() SET search_path = public;
ALTER FUNCTION public.is_manager_or_higher() SET search_path = public;
ALTER FUNCTION public.is_paid_user() SET search_path = public;

-- 2. Trigger Functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.enforce_max_devices() SET search_path = public;

-- 3. App Feature Functions
ALTER FUNCTION public.activate_subscription(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.has_active_subscription(UUID) SET search_path = public;

-- 4. Analytics & Admin Functions
ALTER FUNCTION public.get_admin_contributions_by_period(TIMESTAMP, TIMESTAMP) SET search_path = public;
ALTER FUNCTION public.get_admin_payable_stats() SET search_path = public;
ALTER FUNCTION public.get_admin_contribution_details(UUID, TIMESTAMP, TIMESTAMP) SET search_path = public;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT '✅ Search path security applied to 11 functions' AS status;
