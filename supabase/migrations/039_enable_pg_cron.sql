-- Migration 039: Enable pg_cron for Automated Maintenance
-- pg_cron is a Pro plan feature for scheduling database jobs

-- ============================================================================
-- ENABLE pg_cron EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- SCHEDULE CLEANUP JOBS
-- ============================================================================

-- Weekly: Clean up old chat sessions (7+ days old)
-- Runs every Sunday at 3 AM UTC
SELECT cron.schedule (
        'cleanup-old-chat-sessions', '0 3 * * 0', $$DELETE
        FROM public.chat_sessions
        WHERE
            created_at < NOW() - INTERVAL '7 days' $$
    );

-- Weekly: Clean up old chat messages for deleted sessions
-- Runs every Sunday at 3:30 AM UTC
SELECT cron.schedule (
        'cleanup-orphan-chat-messages', '30 3 * * 0', $$DELETE
        FROM public.chat_messages
        WHERE
            session_id NOT IN(
                SELECT id
                FROM public.chat_sessions
            ) $$
    );

-- Weekly: Clean up inactive device sessions (90+ days)
-- Runs every Sunday at 4 AM UTC
SELECT cron.schedule (
        'cleanup-inactive-devices', '0 4 * * 0', $$DELETE
        FROM public.device_sessions
        WHERE
            last_active_at < NOW() - INTERVAL '90 days' $$
    );

-- NOTE: test_attempts are NOT cleaned up - kept forever for AI fine-tuning

-- ============================================================================
-- MAINTENANCE JOBS
-- ============================================================================

-- Daily: Update table statistics for query optimizer
-- Runs every day at 5 AM UTC
SELECT cron.schedule (
        'daily-analyze-tables', '0 5 * * *', $$ANALYZE public.questions, public.answers, public.users, public.test_attempts, public.activation_keys$$
    );

-- Weekly: Vacuum to reclaim storage from deleted rows
-- Runs every Saturday at 2 AM UTC
SELECT cron.schedule (
        'weekly-vacuum', '0 2 * * 6', $$VACUUM (VERBOSE, ANALYZE) public.questions, public.answers, public.test_attempts, public.chat_sessions, public.device_sessions$$
    );

-- ============================================================================
-- Verification
-- ============================================================================

DO $$ DECLARE job_count INTEGER;

BEGIN
SELECT COUNT(*) INTO job_count
FROM cron.job;

RAISE NOTICE '✅ Migration 039 completed. Scheduled cron jobs: %',
job_count;

END $$;

-- List all scheduled jobs for verification
-- SELECT * FROM cron.job;