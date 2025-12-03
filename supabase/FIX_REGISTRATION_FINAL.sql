-- ============================================================================
-- FINAL FIX: User Registration with Database Function
-- ============================================================================
-- The issue: After signUp(), if email confirmation is enabled, auth.uid() is NULL
-- Solution: Create a SECURITY DEFINER function to handle user profile creation
-- ============================================================================

-- ============================================================================
-- STEP 1: Create function to register user profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_speciality TEXT,
  p_year_of_study TEXT,
  p_region TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs with elevated privileges, bypassing RLS
SET search_path = public
AS $$
BEGIN
  -- Insert the user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    speciality,
    year_of_study,
    region,
    role,
    is_paid
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_speciality,
    p_year_of_study,
    p_region,
    'student',
    FALSE
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User profile created successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User profile already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users and anon (for signup)
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- ============================================================================
-- STEP 2: Ensure activation_keys policies allow the flow
-- ============================================================================

-- Drop and recreate activation key policies
DROP POLICY IF EXISTS "Anyone can check activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "System can update activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can view activation keys" ON public.activation_keys;

-- Allow anyone to read unused keys (needed for validation before signup completes)
CREATE POLICY "Public can read unused activation keys"
  ON public.activation_keys FOR SELECT
  USING (is_used = FALSE);

-- Allow authenticated users to see their own used keys
CREATE POLICY "Users can see own used keys"
  ON public.activation_keys FOR SELECT
  USING (used_by = auth.uid());

-- Allow updates (the activate_subscription function handles this)
CREATE POLICY "Allow activation key updates"
  ON public.activation_keys FOR UPDATE
  USING (TRUE);

-- ============================================================================
-- STEP 3: Verify
-- ============================================================================

SELECT 'Registration function created! Update React Native app to use it.' AS status;
