-- ============================================================================
-- CREATE ADMIN USER - Complete Script
-- ============================================================================
-- This script creates a complete admin user in both auth.users and public.users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create user in auth.users (if not already created in Dashboard)
-- Note: If you already created the user in Supabase Dashboard, skip this step

-- Step 2: Add user to public.users table with role
-- Replace these values with your actual user data:

INSERT INTO public.users (
  id,                                        -- UUID from auth.users
  email,                                     -- Email address
  full_name,                                 -- Full name (optional)
  role,                                      -- Role: owner, admin, manager, student
  is_paid,                                   -- Is subscription active
  subscription_expires_at                    -- Subscription expiry date
)
VALUES (
  '0b16f96d-d23c-4321-98be-97e9f4652b9f',  -- Your user ID from auth.users
  'qcmadin@gmail.com',                      -- Your email
  'Admin User',                              -- Your name
  'admin',                                   -- Role (change to 'owner' for highest permission)
  true,                                      -- Paid subscription
  '2099-12-31'::timestamptz                 -- Never expires
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_paid = EXCLUDED.is_paid,
  subscription_expires_at = EXCLUDED.subscription_expires_at;

-- Step 3: Verify the user was created
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_paid,
  u.subscription_expires_at,
  u.created_at
FROM public.users u
WHERE u.email = 'qcmadin@gmail.com';

-- ============================================================================
-- ROLE TYPES
-- ============================================================================
-- owner    - Full system access, cannot be modified
-- admin    - User management, question management, key generation
-- manager  - Question management only
-- student  - Browse questions (if paid), practice, save questions
-- ============================================================================

-- ============================================================================
-- EXAMPLE: Create Multiple Admin Users
-- ============================================================================

-- Admin User 1
INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
SELECT 
  id,
  email,
  'Admin User 1',
  'admin',
  true,
  '2099-12-31'::timestamptz
FROM auth.users
WHERE email = 'admin1@example.com'
ON CONFLICT (id) DO NOTHING;

-- Admin User 2
INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
SELECT 
  id,
  email,
  'Admin User 2',
  'admin',
  true,
  '2099-12-31'::timestamptz
FROM auth.users
WHERE email = 'admin2@example.com'
ON CONFLICT (id) DO NOTHING;

-- Owner User (Highest Permission)
INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
SELECT 
  id,
  email,
  'Owner User',
  'owner',
  true,
  '2099-12-31'::timestamptz
FROM auth.users
WHERE email = 'owner@example.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if user exists in auth.users
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'qcmadin@gmail.com';

-- Check if user exists in public.users
SELECT id, email, role, is_paid
FROM public.users
WHERE email = 'qcmadin@gmail.com';

-- If user exists in auth.users but not in public.users, run the INSERT above

-- ============================================================================
-- COMMON ISSUES
-- ============================================================================

-- Issue 1: User can't log in
-- Solution: Make sure user exists in BOTH auth.users AND public.users

-- Issue 2: "Access denied" after login
-- Solution: Check the role in public.users (should be admin, owner, or manager)

-- Issue 3: User ID mismatch
-- Solution: Make sure the ID in public.users matches the ID in auth.users

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- This query shows all users with their auth status and roles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  au.last_sign_in_at,
  pu.role,
  pu.is_paid,
  pu.subscription_expires_at,
  CASE 
    WHEN pu.id IS NULL THEN '❌ Missing in public.users'
    WHEN pu.role IN ('admin', 'owner', 'manager') THEN '✅ Can access admin panel'
    ELSE '❌ Student role - no admin access'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.created_at DESC;

-- ============================================================================
