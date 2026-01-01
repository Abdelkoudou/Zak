-- ============================================================================
-- Migration: Fix Security Definer Views
-- ============================================================================
-- This migration addresses Supabase linter warnings by switching analytics
-- and dashboard views from SECURITY DEFINER to SECURITY INVOKER.
-- This ensures the views respect the RLS policies of the querying user.
-- ============================================================================

-- 1. Update activation_keys_with_users
-- This view is used by the admin dashboard. Admins already have RLS
-- permissions to see all users and keys.
ALTER VIEW IF EXISTS public.activation_keys_with_users SET (security_invoker = true);

-- 2. Update faculty_stats
-- Aggregated statistics for faculties.
ALTER VIEW IF EXISTS public.faculty_stats SET (security_invoker = true);

-- 3. Update sales_point_stats
-- Aggregated statistics for sales points.
ALTER VIEW IF EXISTS public.sales_point_stats SET (security_invoker = true);

-- 4. Update admin_contributions
-- Summary of admin contributions for payment tracking.
ALTER VIEW IF EXISTS public.admin_contributions SET (security_invoker = true);

-- ============================================================================
-- Verification Notice
-- ============================================================================
-- After applying this, verify that:
-- 1. Admins/Owners can still see full dashboard data in db-interface.
-- 2. Normal authenticated users cannot see other users' data via these views.
-- ============================================================================
SELECT '✅ Security properties updated for dashboard views' AS status;
