-- ============================================================================
-- Migration: Question Entry Improvements
-- ============================================================================
-- This migration adds new fields to support:
-- 1. Speciality tracking (Médecine, Pharmacie, Dentaire)
-- 2. Multiple cours per question
-- 3. Unity/Module distinction for UEI questions
-- 4. User tracking (who created the question)
-- 5. Removes explanation field
-- ============================================================================

-- Step 1: Add new columns to questions table
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS speciality TEXT,
  ADD COLUMN IF NOT EXISTS cours TEXT[],
  ADD COLUMN IF NOT EXISTS unity_name TEXT,
  ADD COLUMN IF NOT EXISTS module_type module_type,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Step 2: Add foreign key constraint for created_by
ALTER TABLE public.questions
  ADD CONSTRAINT fk_questions_created_by 
  FOREIGN KEY (created_by) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;

-- Step 3: Add check constraint for speciality
ALTER TABLE public.questions
  ADD CONSTRAINT check_speciality 
  CHECK (speciality IS NULL OR speciality IN ('Médecine', 'Pharmacie', 'Dentaire'));

-- Step 4: Remove explanation column (if exists)
ALTER TABLE public.questions
  DROP COLUMN IF EXISTS explanation;

-- Step 5: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_questions_speciality ON public.questions(speciality);
CREATE INDEX IF NOT EXISTS idx_questions_module_type ON public.questions(module_type);
CREATE INDEX IF NOT EXISTS idx_questions_unity_name ON public.questions(unity_name);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON public.questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_cours ON public.questions USING GIN(cours);

-- Step 6: Populate module_type for existing questions based on their module
-- This ensures backward compatibility
UPDATE public.questions q
SET module_type = m.type
FROM public.modules m
WHERE q.module_name = m.name
AND q.module_type IS NULL;

-- Step 7: Make module_type NOT NULL after populating existing data
-- Wait a moment to ensure all updates are complete
DO $$
BEGIN
  -- Check if there are any NULL module_types
  IF EXISTS (SELECT 1 FROM public.questions WHERE module_type IS NULL) THEN
    RAISE NOTICE 'Warning: Some questions still have NULL module_type. Please review.';
  ELSE
    -- Make it NOT NULL
    ALTER TABLE public.questions
      ALTER COLUMN module_type SET NOT NULL;
    RAISE NOTICE '✅ module_type set to NOT NULL';
  END IF;
END $$;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN public.questions.speciality IS 'Medical speciality: Médecine, Pharmacie, or Dentaire';
COMMENT ON COLUMN public.questions.cours IS 'Array of course names associated with this question';
COMMENT ON COLUMN public.questions.unity_name IS 'For UEI questions, stores the unity/UEI name (e.g., "Appareil Cardio-vasculaire")';
COMMENT ON COLUMN public.questions.module_type IS 'Type of module: annual, semestrial, uei, or standalone';
COMMENT ON COLUMN public.questions.created_by IS 'User ID of the person who created this question';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  total_questions INTEGER;
  questions_with_module_type INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_questions FROM public.questions;
  SELECT COUNT(*) INTO questions_with_module_type FROM public.questions WHERE module_type IS NOT NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total questions: %', total_questions;
  RAISE NOTICE 'Questions with module_type: %', questions_with_module_type;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - speciality (TEXT with check constraint)';
  RAISE NOTICE '  - cours (TEXT[])';
  RAISE NOTICE '  - unity_name (TEXT)';
  RAISE NOTICE '  - module_type (module_type ENUM, NOT NULL)';
  RAISE NOTICE '  - created_by (UUID, references users)';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed columns:';
  RAISE NOTICE '  - explanation';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
