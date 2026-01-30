-- ============================================================================
-- Migration: Add fingerprint index and clean up legacy sessions
-- Purpose: Performance optimization for 2-device feature at scale
-- ============================================================================

-- 1. Add index for faster fingerprint-based queries
-- This speeds up the enforce_max_devices trigger and cleanup operations
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_fingerprint ON device_sessions (user_id, fingerprint);

-- 2. Clean up very old sessions without fingerprint (inactive > 7 days)
-- These are legacy sessions from before fingerprint was added
DELETE FROM device_sessions
WHERE
    fingerprint IS NULL
    AND last_active_at < NOW() - INTERVAL '7 days';

-- 3. Add a comment documenting the 2-device enforcement
COMMENT ON
TABLE device_sessions IS 'Stores device sessions for authenticated users. 
Limited to 2 physical devices per regular user (enforced by enforce_max_devices trigger).
Admin/owner/manager roles and reviewers are exempt from this limit.
Physical devices are identified by fingerprint (OS + screen resolution).';