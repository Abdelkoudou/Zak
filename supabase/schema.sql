-- ============================================================================
-- MCQ Study App - Supabase Database Schema
-- ============================================================================
-- This schema supports the French medical curriculum structure for Algeria
-- with predefined modules, questions, resources, and user management.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Year levels
CREATE TYPE year_level AS ENUM ('1', '2', '3');

-- Module types
CREATE TYPE module_type AS ENUM ('annual', 'semestrial', 'uei', 'standalone');

-- Exam types
CREATE TYPE exam_type AS ENUM (
  'EMD', 'EMD1', 'EMD2', 'Rattrapage',
  'M1', 'M2', 'M3', 'M4'
);

-- User roles
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'student');

-- Resource types
CREATE TYPE resource_type AS ENUM ('google_drive', 'telegram', 'youtube', 'pdf', 'other');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'student' NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modules table (predefined, read-only for most users)
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  year year_level NOT NULL,
  type module_type NOT NULL,
  exam_types exam_type[] NOT NULL,
  has_sub_disciplines BOOLEAN DEFAULT FALSE,
  sub_disciplines JSONB, -- Array of {name: string, examTypes: exam_type[]}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year year_level NOT NULL,
  module_name TEXT NOT NULL REFERENCES public.modules(name) ON DELETE CASCADE,
  sub_discipline TEXT, -- Optional, for U.E.I modules
  exam_type exam_type NOT NULL,
  number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique question numbers per module/exam
  UNIQUE(year, module_name, sub_discipline, exam_type, number)
);

-- Answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D', 'E')),
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique option labels per question
  UNIQUE(question_id, option_label)
);

-- Course resources table
CREATE TABLE public.course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year year_level NOT NULL,
  module_name TEXT NOT NULL REFERENCES public.modules(name) ON DELETE CASCADE,
  sub_discipline TEXT, -- Optional, for U.E.I modules
  title TEXT NOT NULL,
  type resource_type NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation keys table
CREATE TABLE public.activation_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_code TEXT UNIQUE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 365,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device sessions table (max 2 per user)
CREATE TABLE public.device_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique device per user
  UNIQUE(user_id, device_id)
);

-- Saved questions table (user's bookmarks)
CREATE TABLE public.saved_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can't save same question twice
  UNIQUE(user_id, question_id)
);

-- Test attempts table (user's practice results)
CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year year_level NOT NULL,
  module_name TEXT NOT NULL,
  sub_discipline TEXT,
  exam_type exam_type NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_paid ON public.users(is_paid);
CREATE INDEX idx_users_email ON public.users(email);

-- Modules indexes
CREATE INDEX idx_modules_year ON public.modules(year);
CREATE INDEX idx_modules_type ON public.modules(type);
CREATE INDEX idx_modules_name ON public.modules(name);

-- Questions indexes
CREATE INDEX idx_questions_year ON public.questions(year);
CREATE INDEX idx_questions_module ON public.questions(module_name);
CREATE INDEX idx_questions_exam_type ON public.questions(exam_type);
CREATE INDEX idx_questions_number ON public.questions(number);
CREATE INDEX idx_questions_sub_discipline ON public.questions(sub_discipline);

-- Answers indexes
CREATE INDEX idx_answers_question ON public.answers(question_id);
CREATE INDEX idx_answers_is_correct ON public.answers(is_correct);

-- Resources indexes
CREATE INDEX idx_resources_year ON public.course_resources(year);
CREATE INDEX idx_resources_module ON public.course_resources(module_name);
CREATE INDEX idx_resources_type ON public.course_resources(type);

-- Activation keys indexes
CREATE INDEX idx_activation_keys_code ON public.activation_keys(key_code);
CREATE INDEX idx_activation_keys_is_used ON public.activation_keys(is_used);

-- Device sessions indexes
CREATE INDEX idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_last_active ON public.device_sessions(last_active_at);

-- Saved questions indexes
CREATE INDEX idx_saved_questions_user ON public.saved_questions(user_id);
CREATE INDEX idx_saved_questions_question ON public.saved_questions(question_id);

-- Test attempts indexes
CREATE INDEX idx_test_attempts_user ON public.test_attempts(user_id);
CREATE INDEX idx_test_attempts_module ON public.test_attempts(module_name);
CREATE INDEX idx_test_attempts_completed ON public.test_attempts(completed_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.course_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enforce max 2 device sessions per user
CREATE OR REPLACE FUNCTION enforce_max_devices()
RETURNS TRIGGER AS $$
DECLARE
  device_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO device_count
  FROM public.device_sessions
  WHERE user_id = NEW.user_id;
  
  IF device_count >= 2 THEN
    -- Delete oldest session
    DELETE FROM public.device_sessions
    WHERE id = (
      SELECT id FROM public.device_sessions
      WHERE user_id = NEW.user_id
      ORDER BY last_active_at ASC
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_devices_trigger
  BEFORE INSERT ON public.device_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_devices();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to activate subscription with key
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_key_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_key RECORD;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  -- Get the activation key
  SELECT * INTO v_key
  FROM public.activation_keys
  WHERE key_code = p_key_code
  AND is_used = FALSE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Invalid or already used activation key'
    );
  END IF;
  
  -- Calculate new expiry date
  SELECT GREATEST(
    COALESCE(subscription_expires_at, NOW()),
    NOW()
  ) + (v_key.duration_days || ' days')::INTERVAL
  INTO v_new_expiry
  FROM public.users
  WHERE id = p_user_id;
  
  -- Update user subscription
  UPDATE public.users
  SET 
    is_paid = TRUE,
    subscription_expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Mark key as used
  UPDATE public.activation_keys
  SET 
    is_used = TRUE,
    used_by = p_user_id,
    used_at = NOW()
  WHERE id = v_key.id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Subscription activated successfully',
    'expires_at', v_new_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_paid BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT is_paid, subscription_expires_at
  INTO v_is_paid, v_expires_at
  FROM public.users
  WHERE id = p_user_id;
  
  RETURN v_is_paid AND (v_expires_at IS NULL OR v_expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts with roles and subscription status';
COMMENT ON TABLE public.modules IS 'Predefined modules from French medical curriculum (17 total)';
COMMENT ON TABLE public.questions IS 'MCQ questions organized by module and exam type';
COMMENT ON TABLE public.answers IS 'Answer options for questions (A-E)';
COMMENT ON TABLE public.course_resources IS 'Links to course materials (Google Drive, Telegram, etc.)';
COMMENT ON TABLE public.activation_keys IS 'Subscription activation keys';
COMMENT ON TABLE public.device_sessions IS 'User device tracking (max 2 per user)';
COMMENT ON TABLE public.saved_questions IS 'User bookmarked questions';
COMMENT ON TABLE public.test_attempts IS 'User practice test results';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
