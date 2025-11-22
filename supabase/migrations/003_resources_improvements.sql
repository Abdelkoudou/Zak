-- ============================================================================
-- Migration: Resources Improvements
-- ============================================================================
-- This migration adds new fields to course_resources table to match
-- the enhancements made to the questions table
-- ============================================================================

-- Step 1: Add new columns to course_resources table
ALTER TABLE public.course_resources
  ADD COLUMN IF NOT EXISTS speciality TEXT,
  ADD COLUMN IF NOT EXISTS cours TEXT[],
  ADD COLUMN IF NOT EXISTS unity_name TEXT,
  ADD COLUMN IF NOT EXISTS module_type module_type,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Step 2: Add foreign key constraint for created_by
ALTER TABLE public.course_resources
  ADD CONSTRAINT fk_resources_created_by 
  FOREIGN KEY (created_by) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;

-- Step 3: Add check constraint for speciality
ALTER TABLE public.course_resources
  ADD CONSTRAINT check_resource_speciality 
  CHECK (speciality IS NULL OR speciality IN ('Médecine', 'Pharmacie', 'Dentaire'));

-- Step 4: Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_resources_speciality ON public.course_resources(speciality);
CREATE INDEX IF NOT EXISTS idx_resources_module_type ON public.course_resources(module_type);
CREATE INDEX IF NOT EXISTS idx_resources_unity_name ON public.course_resources(unity_name);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON public.course_resources(created_by);
CREATE INDEX IF NOT EXISTS idx_resources_cours ON public.course_resources USING GIN(cours);

-- Step 5: Populate module_type for existing resources based on their module
UPDATE public.course_resources r
SET module_type = m.type
FROM public.modules m
WHERE r.module_name = m.name
AND r.module_type IS NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN public.course_resources.speciality IS 'Medical speciality: Médecine, Pharmacie, or Dentaire';
COMMENT ON COLUMN public.course_resources.cours IS 'Array of course names associated with this resource';
COMMENT ON COLUMN public.course_resources.unity_name IS 'For UEI resources, stores the unity/UEI name';
COMMENT ON COLUMN public.course_resources.module_type IS 'Type of module: annual, semestrial, uei, or standalone';
COMMENT ON COLUMN public.course_resources.created_by IS 'User ID of the person who created this resource';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  total_resources INTEGER;
  resources_with_module_type INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_resources FROM public.course_resources;
  SELECT COUNT(*) INTO resources_with_module_type FROM public.course_resources WHERE module_type IS NOT NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Resources migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total resources: %', total_resources;
  RAISE NOTICE 'Resources with module_type: %', resources_with_module_type;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - speciality (TEXT with check constraint)';
  RAISE NOTICE '  - cours (TEXT[])';
  RAISE NOTICE '  - unity_name (TEXT)';
  RAISE NOTICE '  - module_type (module_type ENUM)';
  RAISE NOTICE '  - created_by (UUID, references users)';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
