-- ============================================================================
-- Migration: Fix Device Enforcement (BLOCK instead of auto-delete)
-- Version 2: Added Fingerprint for Hierarchical Grouping (App + Web)
-- ============================================================================

-- Add fingerprint column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_sessions' AND column_name = 'fingerprint') THEN
    ALTER TABLE public.device_sessions ADD COLUMN fingerprint TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 1: Replace trigger function to BLOCK instead of DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_max_devices()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  physical_device_count INTEGER;
BEGIN
  -- Count unique physical devices for this user
  -- We group by fingerprint. If fingerprint is NULL (legacy), we group by device_id.
  -- This allows multiple sessions (App, Browser) on 1 phone to count as 1 device.
  SELECT COUNT(DISTINCT COALESCE(fingerprint, device_id)) INTO physical_device_count
  FROM public.device_sessions
  WHERE user_id = NEW.user_id
  AND device_id != NEW.device_id; -- Don't count self if updating existing record
  
  -- Consider it a NEW physical device only if its fingerprint/ID combination 
  -- doesn't match any existing registered hardware.
  IF physical_device_count >= 2 AND 
     NOT EXISTS (
       SELECT 1 FROM public.device_sessions 
       WHERE user_id = NEW.user_id 
       AND COALESCE(fingerprint, 'none') = COALESCE(NEW.fingerprint, 'none')
       -- Note: we use 'none' for COALESCE to ensure NULL=NULL match for logic
     ) AND
     NOT EXISTS (
       SELECT 1 FROM public.device_sessions
       WHERE user_id = NEW.user_id
       AND device_id = NEW.device_id
     )
  THEN
    RAISE EXCEPTION 'DEVICE_LIMIT_EXCEEDED: Maximum 2 physical devices allowed'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Remove user DELETE permission, keep admin DELETE only
-- ============================================================================
-- (Keep same as before)

-- Drop existing device_sessions policies to avoid conflicts
DROP POLICY IF EXISTS "Users manage own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users delete own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "View device sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users update own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users can create own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users can update own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.device_sessions;

DROP POLICY IF EXISTS "Users register own devices" ON public.device_sessions;

DROP POLICY IF EXISTS "Admins delete device sessions" ON public.device_sessions;

-- CREATE NEW POLICIES (No user DELETE!)

-- View: Users see own, admins see all
CREATE POLICY "View device sessions" ON public.device_sessions FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid ()
        )
        OR is_admin_or_higher ()
    );

-- Insert: Users can register their own devices
CREATE POLICY "Users register own devices" ON public.device_sessions FOR
INSERT
    TO authenticated
WITH
    CHECK (
        user_id = (
            SELECT auth.uid ()
        )
    );

-- Update: Users can update their own (for last_active_at)
CREATE POLICY "Users update own sessions" ON public.device_sessions FOR
UPDATE TO authenticated USING (
    user_id = (
        SELECT auth.uid ()
    )
)
WITH
    CHECK (
        user_id = (
            SELECT auth.uid ()
        )
    );

-- DELETE: ADMIN ONLY!
CREATE POLICY "Admins delete device sessions" ON public.device_sessions FOR DELETE TO authenticated USING (is_admin_or_higher ());

-- ============================================================================
-- STEP 3: Add helpful comment
-- ============================================================================

COMMENT ON
TABLE public.device_sessions IS 'User device tracking. Max 2 devices per user (enforced by trigger).
Users CANNOT delete their own sessions - admin only.
Device IDs should be UUIDs, not screen-based hashes.
Updated in Migration 035.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Device enforcement migration 035 complete';
  RAISE NOTICE '   - Trigger now BLOCKS instead of auto-deleting';
  RAISE NOTICE '   - User DELETE permission removed';
  RAISE NOTICE '   - Only admins can delete device sessions';
END $$;