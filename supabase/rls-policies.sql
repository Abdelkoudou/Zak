-- ============================================================================
-- MCQ Study App - Row Level Security (RLS) Policies
-- ============================================================================
-- These policies control who can access what data in the database
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is manager or higher
CREATE OR REPLACE FUNCTION is_manager_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has paid subscription
CREATE OR REPLACE FUNCTION is_paid_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_paid = TRUE
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role and subscription)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_paid = (SELECT is_paid FROM public.users WHERE id = auth.uid())
  );

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin_or_higher());

-- Admins can update user roles and subscriptions
CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (is_admin_or_higher());

-- Owner can insert new users (for admin creation)
CREATE POLICY "Owner can create users"
  ON public.users FOR INSERT
  WITH CHECK (is_owner());

-- ============================================================================
-- MODULES TABLE POLICIES
-- ============================================================================

-- Everyone can view modules (they're public reference data)
CREATE POLICY "Everyone can view modules"
  ON public.modules FOR SELECT
  USING (TRUE);

-- Only owner can modify modules (they're predefined)
CREATE POLICY "Only owner can modify modules"
  ON public.modules FOR ALL
  USING (is_owner())
  WITH CHECK (is_owner());

-- ============================================================================
-- QUESTIONS TABLE POLICIES
-- ============================================================================

-- Paid users can view all questions
CREATE POLICY "Paid users can view questions"
  ON public.questions FOR SELECT
  USING (is_paid_user() OR is_manager_or_higher());

-- Managers and above can create questions
CREATE POLICY "Managers can create questions"
  ON public.questions FOR INSERT
  WITH CHECK (is_manager_or_higher());

-- Managers and above can update questions
CREATE POLICY "Managers can update questions"
  ON public.questions FOR UPDATE
  USING (is_manager_or_higher());

-- Admins and above can delete questions
CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (is_admin_or_higher());

-- ============================================================================
-- ANSWERS TABLE POLICIES
-- ============================================================================

-- Paid users can view answers (through questions)
CREATE POLICY "Paid users can view answers"
  ON public.answers FOR SELECT
  USING (
    is_paid_user() OR is_manager_or_higher()
  );

-- Managers and above can create answers
CREATE POLICY "Managers can create answers"
  ON public.answers FOR INSERT
  WITH CHECK (is_manager_or_higher());

-- Managers and above can update answers
CREATE POLICY "Managers can update answers"
  ON public.answers FOR UPDATE
  USING (is_manager_or_higher());

-- Admins and above can delete answers
CREATE POLICY "Admins can delete answers"
  ON public.answers FOR DELETE
  USING (is_admin_or_higher());

-- ============================================================================
-- COURSE RESOURCES TABLE POLICIES
-- ============================================================================

-- Paid users can view resources
CREATE POLICY "Paid users can view resources"
  ON public.course_resources FOR SELECT
  USING (is_paid_user() OR is_manager_or_higher());

-- Managers and above can create resources
CREATE POLICY "Managers can create resources"
  ON public.course_resources FOR INSERT
  WITH CHECK (is_manager_or_higher());

-- Managers and above can update resources
CREATE POLICY "Managers can update resources"
  ON public.course_resources FOR UPDATE
  USING (is_manager_or_higher());

-- Admins and above can delete resources
CREATE POLICY "Admins can delete resources"
  ON public.course_resources FOR DELETE
  USING (is_admin_or_higher());

-- ============================================================================
-- ACTIVATION KEYS TABLE POLICIES
-- ============================================================================

-- Users can view unused keys (to activate)
CREATE POLICY "Users can view unused keys"
  ON public.activation_keys FOR SELECT
  USING (is_used = FALSE OR used_by = auth.uid());

-- Admins can create activation keys
CREATE POLICY "Admins can create keys"
  ON public.activation_keys FOR INSERT
  WITH CHECK (is_admin_or_higher());

-- Admins can view all keys
CREATE POLICY "Admins can view all keys"
  ON public.activation_keys FOR SELECT
  USING (is_admin_or_higher());

-- System can update keys (when used)
CREATE POLICY "System can update keys"
  ON public.activation_keys FOR UPDATE
  USING (TRUE);

-- ============================================================================
-- DEVICE SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own device sessions
CREATE POLICY "Users can view own sessions"
  ON public.device_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own device sessions
CREATE POLICY "Users can create own sessions"
  ON public.device_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own device sessions
CREATE POLICY "Users can update own sessions"
  ON public.device_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own device sessions
CREATE POLICY "Users can delete own sessions"
  ON public.device_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.device_sessions FOR SELECT
  USING (is_admin_or_higher());

-- ============================================================================
-- SAVED QUESTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own saved questions
CREATE POLICY "Users can view own saved questions"
  ON public.saved_questions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save questions
CREATE POLICY "Users can save questions"
  ON public.saved_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_paid_user());

-- Users can unsave questions
CREATE POLICY "Users can unsave questions"
  ON public.saved_questions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TEST ATTEMPTS TABLE POLICIES
-- ============================================================================

-- Users can view their own test attempts
CREATE POLICY "Users can view own attempts"
  ON public.test_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own test attempts
CREATE POLICY "Users can create own attempts"
  ON public.test_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_paid_user());

-- Admins can view all test attempts (for analytics)
CREATE POLICY "Admins can view all attempts"
  ON public.test_attempts FOR SELECT
  USING (is_admin_or_higher());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT ON public.modules TO authenticated, anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.questions TO authenticated;
GRANT ALL ON public.answers TO authenticated;
GRANT ALL ON public.course_resources TO authenticated;
GRANT ALL ON public.activation_keys TO authenticated;
GRANT ALL ON public.device_sessions TO authenticated;
GRANT ALL ON public.saved_questions TO authenticated;
GRANT ALL ON public.test_attempts TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully';
  RAISE NOTICE 'Total policies: %', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public');
END $$;

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
