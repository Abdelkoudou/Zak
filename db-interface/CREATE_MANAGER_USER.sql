-- ============================================================================
-- CREATE MANAGER USER (Restricted Admin)
-- ============================================================================
-- This script creates a user with the 'manager' role.
-- Managers can:
-- 1. Add/Edit Questions (AST)
-- 2. Add/Edit Course Resources (COURS)
-- 
-- Managers CANNOT:
-- 1. Generate activation keys
-- 2. View financial stats
-- 3. Manage other users
-- ============================================================================

-- Step 1: Create user in auth.users (if not already created in Dashboard)
-- Note: If you already created the user in Supabase Dashboard, skip this step and just get their UUID

-- Step 2: Add user to public.users table with 'manager' role
-- Replace these values with your actual user data:

INSERT INTO public.users (
  id,                                        -- UUID from auth.users
  email,                                     -- Email address
  full_name,                                 -- Full name
  role,                                      -- Role: 'manager'
  is_paid,                                   -- Managers usually get paid access too
  subscription_expires_at                    -- Subscription expiry
)
VALUES (
  'REPLACE_WITH_USER_UUID',                  -- ⚠️ PASTE USER UUID HERE
  'manager@example.com',                     -- ⚠️ PASTE USER EMAIL HERE
  'Manager User',                            -- Name
  'manager',                                 -- ⚠️ ROLE MUST BE 'manager'
  true,                                      -- Paid subscription (so they can see content)
  '2099-12-31'::timestamptz                  -- Never expires
)
ON CONFLICT (id) DO UPDATE SET
  role = 'manager',                          -- Enforce manager role
  is_paid = EXCLUDED.is_paid,
  subscription_expires_at = EXCLUDED.subscription_expires_at;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT id, email, role, created_at 
FROM public.users 
WHERE role = 'manager'
ORDER BY created_at DESC;
