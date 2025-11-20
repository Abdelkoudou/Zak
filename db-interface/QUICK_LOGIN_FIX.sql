-- ============================================================================
-- QUICK LOGIN FIX - Run this in Supabase SQL Editor
-- ============================================================================
-- This script will diagnose and fix common login issues
-- ============================================================================

-- Step 1: Check if user exists in auth.users
SELECT 
  '1. AUTH.USERS CHECK' as step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User exists in auth.users'
    ELSE '❌ User NOT in auth.users - Create user in Supabase Dashboard first!'
  END as status,
  COUNT(*) as count
FROM auth.users
WHERE email = 'qcmadin@gmail.com';

-- Step 2: Check if user exists in public.users
SELECT 
  '2. PUBLIC.USERS CHECK' as step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User exists in public.users'
    ELSE '❌ User NOT in public.users - THIS IS THE PROBLEM!'
  END as status,
  COUNT(*) as count
FROM public.users
WHERE email = 'qcmadin@gmail.com';

-- Step 3: Check user role
SELECT 
  '3. ROLE CHECK' as step,
  CASE 
    WHEN role IN ('admin', 'owner', 'manager') THEN '✅ User has admin access'
    ELSE '❌ User role is "' || role || '" - needs to be admin/owner/manager'
  END as status,
  role
FROM public.users
WHERE email = 'qcmadin@gmail.com';

-- Step 4: Check if IDs match
SELECT 
  '4. ID MATCH CHECK' as step,
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs match'
    WHEN pu.id IS NULL THEN '❌ User not in public.users'
    ELSE '❌ IDs do not match - DATA CORRUPTION!'
  END as status,
  au.id as auth_id,
  pu.id as public_id
FROM auth.users au
LEFT JOIN public.users pu ON pu.email = au.email
WHERE au.email = 'qcmadin@gmail.com';

-- ============================================================================
-- FIX: Add user to public.users with admin role
-- ============================================================================

INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
SELECT 
  au.id,
  au.email,
  'Admin User',
  'admin'::user_role,
  true,
  '2099-12-31'::timestamptz
FROM auth.users au
WHERE au.email = 'qcmadin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role,
  is_paid = true,
  subscription_expires_at = '2099-12-31'::timestamptz,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION: Check if fix worked
-- ============================================================================

SELECT 
  '✅ FINAL VERIFICATION' as step,
  au.id,
  au.email,
  au.created_at as auth_created,
  au.last_sign_in_at,
  pu.role,
  pu.is_paid,
  pu.subscription_expires_at,
  CASE 
    WHEN pu.id IS NULL THEN '❌ STILL NOT IN public.users'
    WHEN pu.role NOT IN ('admin', 'owner', 'manager') THEN '❌ WRONG ROLE: ' || pu.role
    WHEN NOT pu.is_paid THEN '⚠️ NOT PAID'
    ELSE '✅ USER IS PROPERLY CONFIGURED - LOGIN SHOULD WORK NOW!'
  END as final_status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'qcmadin@gmail.com';

-- ============================================================================
-- If you see "✅ USER IS PROPERLY CONFIGURED", try logging in now!
-- ============================================================================

-- ============================================================================
-- BONUS: Check RLS policies (if still having issues)
-- ============================================================================

-- Check if RLS is enabled
SELECT 
  'RLS STATUS' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Enabled'
    ELSE '🔓 RLS Disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- Check RLS policies
SELECT 
  'RLS POLICIES' as check_type,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';

-- ============================================================================
-- EMERGENCY FIX: Temporarily disable RLS (ONLY FOR TESTING)
-- ============================================================================
-- Uncomment these lines ONLY if you still can't log in after running above

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- -- Try logging in now
-- -- If it works, the problem is RLS policies
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
