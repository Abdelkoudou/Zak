-- ============================================================================
-- UPDATE: Add Faculty to User Profile
-- ============================================================================

-- 1. Add faculty column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS faculty TEXT;

-- 2. Update create_user_profile function to include faculty
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_speciality TEXT,
  p_year_of_study TEXT,
  p_region TEXT,
  p_faculty TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    faculty,
    role,
    is_paid
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_speciality,
    p_year_of_study,
    p_region,
    p_faculty,
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
