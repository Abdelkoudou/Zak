-- ============================================================================
-- Migration: Enable Realtime for device_sessions
-- Purpose: Allow instant logout when admin deletes a session
-- ============================================================================

-- Add device_sessions to the Realtime publication
-- This enables clients to subscribe to INSERT/UPDATE/DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE device_sessions;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled for device_sessions';
  RAISE NOTICE '   - Clients can now subscribe to session changes';
  RAISE NOTICE '   - Used for instant remote logout feature';
END $$;