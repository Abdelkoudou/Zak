-- ============================================================================
-- CREATE DEVELOPMENT TEST USER & ACTIVATION KEY
-- ============================================================================
-- Run this in Supabase SQL Editor to create test credentials for development
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Test Activation Keys (for registration testing)
-- ============================================================================

-- Create multiple test activation keys
INSERT INTO public.activation_keys (key_code, duration_days, is_used, created_at) VALUES
('TEST-DEV-001', 365, FALSE, NOW()),
('TEST-DEV-002', 365, FALSE, NOW()),
('TEST-DEV-003', 365, FALSE, NOW()),
('TEST-DEV-004', 30, FALSE, NOW()),   -- 30-day key for testing
('TEST-DEV-005', 7, FALSE, NOW())     -- 7-day key for testing
ON CONFLICT (key_code) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Test User (for login testing)
-- ============================================================================
-- IMPORTANT: First create the user in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: testdev@example.com
-- 4. Password: TestDev123!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Copy the User UID and paste it below

-- After creating user in Dashboard, run this to add to public.users:
-- Replace 'YOUR-USER-UUID-HERE' with the actual UUID from Dashboard

/*
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_paid,
  subscription_expires_at,
  speciality,
  year_of_study,
  region
)
VALUES (
  'YOUR-USER-UUID-HERE'::UUID,  -- Replace with actual UUID
  'testdev@example.com',
  'Test Developer',
  'student',
  true,
  '2099-12-31'::timestamptz,
  'Médecine',
  1,
  'Alger'
)
ON CONFLICT (id) DO UPDATE SET
  is_paid = EXCLUDED.is_paid,
  subscription_expires_at = EXCLUDED.subscription_expires_at;
*/

-- ============================================================================
-- STEP 3: Quick Setup - Create User with Known UUID
-- ============================================================================
-- Alternative: Use Supabase's auth.users directly (requires service role)
-- This creates a complete test user in one step

-- First, check if test user already exists
SELECT id, email FROM auth.users WHERE email = 'testdev@example.com';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check available activation keys
SELECT 
  key_code,
  duration_days,
  is_used,
  created_at
FROM public.activation_keys
WHERE key_code LIKE 'TEST-DEV-%'
ORDER BY created_at;

-- Check test user (if created)
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_paid,
  u.subscription_expires_at,
  u.speciality,
  u.year_of_study,
  u.region
FROM public.users u
WHERE u.email = 'testdev@example.com';

-- ============================================================================
-- DEVELOPMENT TEST CREDENTIALS
-- ============================================================================
-- 
-- FOR REGISTRATION TESTING:
--   Use any of these activation codes:
--   - TEST-DEV-001 (365 days)
--   - TEST-DEV-002 (365 days)
--   - TEST-DEV-003 (365 days)
--   - TEST-DEV-004 (30 days)
--   - TEST-DEV-005 (7 days)
--
-- FOR LOGIN TESTING:
--   Email: testdev@example.com
--   Password: TestDev123!
--   (Must create user in Supabase Dashboard first)
--
-- ============================================================================

-- ============================================================================
-- CLEANUP (Optional - to reset test data)
-- ============================================================================

/*
-- Reset activation keys
UPDATE public.activation_keys 
SET is_used = FALSE, used_by = NULL, used_at = NULL
WHERE key_code LIKE 'TEST-DEV-%';

-- Delete test user from public.users
DELETE FROM public.users WHERE email = 'testdev@example.com';

-- Note: To delete from auth.users, use Supabase Dashboard
*/

-- ============================================================================
-- END
-- ============================================================================
