-- ============================================================================
-- Migration: Question Reports / Feedback System
-- ============================================================================
-- Allows users to report issues with questions (errors, unclear text, etc.)
-- Admins can review and manage these reports from the db-interface.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Enums
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE report_type AS ENUM (
    'error_in_question',   -- Erreur dans la question
    'wrong_answer',        -- Réponse incorrecte
    'unclear',             -- Question pas claire
    'duplicate',           -- Question dupliquée
    'outdated',            -- Information obsolète
    'other'                -- Autre
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'pending',    -- En attente de révision
    'reviewing',  -- En cours de révision
    'resolved',   -- Résolu (question corrigée)
    'dismissed'   -- Rejeté (pas de problème)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Create Question Reports Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.question_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Report details
  report_type report_type NOT NULL,
  description TEXT,  -- Optional detailed description
  
  -- Status tracking
  status report_status NOT NULL DEFAULT 'pending',
  
  -- Admin review
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,  -- Internal notes from admin
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON public.question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON public.question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_report_type ON public.question_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON public.question_reports(created_at DESC);

-- ============================================================================
-- STEP 4: Create Updated_at Trigger
-- ============================================================================
CREATE TRIGGER update_question_reports_updated_at
  BEFORE UPDATE ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: RLS Policies
-- ============================================================================
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.question_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.question_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.question_reports FOR SELECT
  USING (is_admin_or_higher());

-- Admins can update reports (for review)
CREATE POLICY "Admins can update reports"
  ON public.question_reports FOR UPDATE
  USING (is_admin_or_higher());

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON public.question_reports FOR DELETE
  USING (is_admin_or_higher());

-- ============================================================================
-- STEP 6: Prevent Duplicate Reports (same user, same question, pending)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_report 
  ON public.question_reports(question_id, user_id) 
  WHERE status = 'pending';

-- ============================================================================
-- STEP 7: View for Report Statistics
-- ============================================================================
CREATE OR REPLACE VIEW public.question_report_stats AS
SELECT
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports,
  COUNT(DISTINCT question_id) as unique_questions_reported,
  COUNT(DISTINCT user_id) as unique_reporters
FROM public.question_reports;

-- Grant access to the view
GRANT SELECT ON public.question_report_stats TO authenticated;

-- ============================================================================
-- STEP 8: Comments
-- ============================================================================
COMMENT ON TABLE public.question_reports IS 'User-submitted reports about question issues';
COMMENT ON COLUMN public.question_reports.report_type IS 'Type of issue being reported';
COMMENT ON COLUMN public.question_reports.description IS 'Optional detailed description from user';
COMMENT ON COLUMN public.question_reports.admin_notes IS 'Internal notes from admin during review';
