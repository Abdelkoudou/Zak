-- ============================================================================
-- Fix Device Session Cleanup RLS Policy
-- ============================================================================
-- Issue: Users cannot delete their own device sessions due to restrictive RLS.
-- This causes the cleanup code in registerDevice() to silently fail when a user
-- reinstalls the app, resulting in duplicate sessions for the same physical device.
--
-- Solution: Add a policy allowing users to delete their own sessions.
-- ============================================================================

-- Allow users to delete their own device sessions
-- This is needed for cleanup when app is reinstalled (new device_id, same fingerprint)
CREATE POLICY "Users delete own sessions" ON public.device_sessions FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid () AS uid
    )
);

-- ============================================================================
-- Clean up existing duplicate sessions
-- ============================================================================
-- Keep only the most recent session per user+fingerprint combination.
-- This ensures a clean state after deploying the fix.

WITH
    ranked AS (
        SELECT id, user_id, fingerprint, ROW_NUMBER() OVER (
                PARTITION BY
                    user_id, fingerprint
                ORDER BY last_active_at DESC
            ) as rn
        FROM public.device_sessions
        WHERE
            fingerprint IS NOT NULL
    )
DELETE FROM public.device_sessions
WHERE
    id IN (
        SELECT id
        FROM ranked
        WHERE
            rn > 1
    );