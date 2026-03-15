-- ============================================================================
-- Migration: Update Question Report Types
-- ============================================================================

-- 1. Add new values to report_type enum
-- Since PostgreSQL doesn't support removing enum values easily, we add the new ones
-- and we will map the old ones to the new ones in the application layer or via data migration.

ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'orthographe';
ALTER TYPE report_type ADD VALUE IF NOT EXISTS 'false_explanation';

-- 2. Map existing data to new categories to maintain history
-- 'error_in_question' -> 'orthographe'
-- 'unclear' -> 'false_explanation'
-- 'duplicate' -> 'other'
-- 'outdated' -> 'other'

UPDATE public.question_reports 
SET report_type = 'orthographe' 
WHERE report_type = 'error_in_question';

UPDATE public.question_reports 
SET report_type = 'false_explanation' 
WHERE report_type = 'unclear';

UPDATE public.question_reports 
SET report_type = 'other' 
WHERE report_type IN ('duplicate', 'outdated');

-- 3. Note: We keep the old enum values in the type definition to avoid breaking existing constraints
-- but they will no longer be used by the applications.
