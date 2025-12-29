-- ============================================================================
-- Migration: Add RLS Policies for Course Management
-- ============================================================================
-- 1. Adds UPDATE policy for owners on public.courses
-- 2. Adds DELETE policy for owners on public.courses
-- ============================================================================

DO $$ 
BEGIN

-- Allow owners to update courses
DROP POLICY IF EXISTS "Owners can update courses" ON public.courses;
CREATE POLICY "Owners can update courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- Allow owners to delete courses
DROP POLICY IF EXISTS "Owners can delete courses" ON public.courses;
CREATE POLICY "Owners can delete courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (is_owner());

END $$;

SELECT '✅ Course management policies added successfully' AS status;
