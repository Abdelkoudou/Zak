-- ============================================================================
-- Migration: Add faculty_source field to questions
-- ============================================================================
-- This migration adds a field to track if a question comes from:
-- - 'fac_mere': Faculté Mère de Constantine
-- - 'annexe': Facultés Annexes (satellite faculties)
-- ============================================================================

-- Step 1: Create enum type for faculty source
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faculty_source') THEN
    CREATE TYPE faculty_source AS ENUM ('fac_mere', 'annexe');
  END IF;
END $$;

-- Step 2: Add faculty_source column to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS faculty_source faculty_source DEFAULT NULL;

-- Step 3: Add index for filtering by faculty_source
CREATE INDEX IF NOT EXISTS idx_questions_faculty_source 
ON public.questions(faculty_source);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.questions.faculty_source IS 
'Source of the question: fac_mere (Faculté Mère de Constantine) or annexe (Facultés Annexes)';

-- Step 5: Verify the migration
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'faculty_source';

-- ============================================================================
-- DONE
-- ============================================================================
SELECT '✅ Faculty source field added to questions table' AS status;
