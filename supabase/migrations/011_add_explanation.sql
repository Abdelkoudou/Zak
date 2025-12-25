-- ============================================================================
-- Migration: Add Explanation Column Back to Questions
-- ============================================================================
-- This migration adds the explanation field back to the questions table.
-- The field was previously removed in migration 002_question_improvements.sql
-- but is now needed to allow admins to optionally provide explanations for answers.
-- ============================================================================

-- Add explanation column (optional text field)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.questions.explanation IS 'Optional explanation shown to users after they submit their answer';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'questions' 
    AND column_name = 'explanation'
  ) THEN
    RAISE NOTICE '✅ Migration completed: explanation column added to questions table';
  ELSE
    RAISE NOTICE '❌ Migration failed: explanation column not found';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
