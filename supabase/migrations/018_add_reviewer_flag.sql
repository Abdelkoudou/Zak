-- ============================================================================
-- Migration: Add reviewer flag for Google Play review accounts
-- ============================================================================
-- This adds a flag to bypass device limits for app store review accounts

-- Add is_reviewer column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_reviewer BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN public.users.is_reviewer IS 'Flag for app store review accounts that bypass device limits';

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_is_reviewer ON public.users(is_reviewer) WHERE is_reviewer = TRUE;
