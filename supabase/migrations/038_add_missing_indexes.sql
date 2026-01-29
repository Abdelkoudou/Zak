-- Migration 038: Performance Fixes - Add Missing FK Indexes & Clean Duplicates
-- Based on Supabase Performance Advisor findings

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- These improve JOIN performance and prevent full table scans
-- ============================================================================

-- app_config.updated_by → auth.users.id
CREATE INDEX IF NOT EXISTS idx_app_config_updated_by ON public.app_config (updated_by);

-- chat_logs.session_id → chat_sessions.id
CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON public.chat_logs (session_id);

-- online_payments.activation_key_id → activation_keys.id
CREATE INDEX IF NOT EXISTS idx_online_payments_activation_key_id ON public.online_payments (activation_key_id);

-- ============================================================================
-- REMOVE DUPLICATE INDEXES
-- These waste space and slow down writes without providing value
-- ============================================================================

-- questions table has duplicate indexes on module_name
-- Keep idx_questions_module, drop idx_questions_module_name (if both exist)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'idx_questions_module_name'
)
AND EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'idx_questions_module'
) THEN
DROP INDEX IF EXISTS public.idx_questions_module_name;

RAISE NOTICE 'Dropped duplicate index: idx_questions_module_name';

END IF;

END $$;

-- questions table has duplicate indexes on cours
-- Keep idx_questions_cours (B-tree), drop idx_questions_cours_gin (GIN on text not optimal)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'idx_questions_cours_gin'
)
AND EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'idx_questions_cours'
) THEN
DROP INDEX IF EXISTS public.idx_questions_cours_gin;

RAISE NOTICE 'Dropped duplicate index: idx_questions_cours_gin';

END IF;

END $$;

-- ============================================================================
-- CLEAN UP POTENTIALLY UNUSED INDEXES (with zero scans)
-- Being conservative here - only removing clearly unused ones
-- ============================================================================
-- sales_points has duplicate indexes on code column
-- Keep unique constraint index, drop the redundant btree index
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'idx_sales_points_code'
)
AND EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE
        indexname = 'sales_points_code_key'
) THEN
DROP INDEX IF EXISTS public.idx_sales_points_code;

RAISE NOTICE 'Dropped duplicate index: idx_sales_points_code (keeping unique constraint)';

END IF;

END $$;

-- ============================================================================
-- UPDATE TABLE STATISTICS for better query planning
-- ============================================================================
ANALYZE public.questions;

ANALYZE public.answers;

ANALYZE public.users;

ANALYZE public.activation_keys;

ANALYZE public.device_sessions;

ANALYZE public.test_attempts;

ANALYZE public.chat_logs;

ANALYZE public.chat_sessions;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$ DECLARE new_index_count INTEGER;

BEGIN
SELECT COUNT(*) INTO new_index_count
FROM pg_indexes
WHERE
    schemaname = 'public'
    AND indexname IN (
        'idx_app_config_updated_by',
        'idx_chat_logs_session_id',
        'idx_online_payments_activation_key_id'
    );

RAISE NOTICE '✅ Migration 038 completed. New FK indexes created: %',
new_index_count;

END $$;