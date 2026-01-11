-- ============================================================================
-- Migration: Chat Sessions & Enhanced Chat Logs
-- ============================================================================
-- Adds chat sessions for conversation history and enhances chat_logs
-- ============================================================================

-- ============================================================================
-- Chat Sessions Table (for conversation history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  preview TEXT, -- First message preview
  message_count INTEGER DEFAULT 0,
  last_model TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_updated_at_idx ON public.chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_sessions_archived_idx ON public.chat_sessions(is_archived);

-- ============================================================================
-- Chat Messages Table (individual messages in a session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT,
  model_name TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  rag_used BOOLEAN DEFAULT FALSE,
  context_count INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_messages_rating_idx ON public.chat_messages(rating) WHERE rating IS NOT NULL;

-- ============================================================================
-- Update chat_logs to link to sessions (optional)
-- ============================================================================
ALTER TABLE public.chat_logs 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL;

-- ============================================================================
-- Analytics View: Chat Statistics
-- ============================================================================
CREATE OR REPLACE VIEW public.chat_analytics AS
SELECT 
  DATE_TRUNC('day', cm.created_at) AS date,
  COUNT(*) AS total_messages,
  COUNT(DISTINCT cs.id) AS total_sessions,
  COUNT(DISTINCT cs.user_id) AS unique_users,
  COUNT(*) FILTER (WHERE cm.role = 'user') AS user_messages,
  COUNT(*) FILTER (WHERE cm.role = 'assistant') AS assistant_messages,
  COUNT(*) FILTER (WHERE cm.rag_used = TRUE) AS rag_hits,
  COUNT(*) FILTER (WHERE cm.fallback_used = TRUE) AS fallback_count,
  AVG(cm.rating) FILTER (WHERE cm.rating IS NOT NULL) AS avg_rating,
  COUNT(cm.rating) FILTER (WHERE cm.rating IS NOT NULL) AS rated_count,
  AVG(cm.response_time_ms) FILTER (WHERE cm.response_time_ms IS NOT NULL) AS avg_response_time,
  MODE() WITHIN GROUP (ORDER BY cm.model) AS most_used_model
FROM public.chat_messages cm
JOIN public.chat_sessions cs ON cm.session_id = cs.id
GROUP BY DATE_TRUNC('day', cm.created_at)
ORDER BY date DESC;

-- ============================================================================
-- Analytics View: Model Usage Stats
-- ============================================================================
CREATE OR REPLACE VIEW public.model_usage_stats AS
SELECT 
  model,
  model_name,
  COUNT(*) AS usage_count,
  AVG(rating) FILTER (WHERE rating IS NOT NULL) AS avg_rating,
  COUNT(rating) FILTER (WHERE rating IS NOT NULL) AS rated_count,
  AVG(response_time_ms) AS avg_response_time,
  COUNT(*) FILTER (WHERE fallback_used = TRUE) AS fallback_count,
  COUNT(*) FILTER (WHERE rag_used = TRUE) AS rag_usage
FROM public.chat_messages
WHERE role = 'assistant' AND model IS NOT NULL
GROUP BY model, model_name
ORDER BY usage_count DESC;

-- ============================================================================
-- Analytics View: Top Topics (from knowledge base hits)
-- ============================================================================
CREATE OR REPLACE VIEW public.top_topics AS
SELECT 
  kb.category,
  kb.title,
  COUNT(*) AS hit_count
FROM public.chat_logs cl
CROSS JOIN LATERAL jsonb_array_elements(cl.context_used) AS ctx
JOIN public.knowledge_base kb ON kb.id = (ctx->>'id')::UUID
GROUP BY kb.category, kb.title
ORDER BY hit_count DESC
LIMIT 20;

-- ============================================================================
-- Function: Update session on new message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_session_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chat_sessions
  SET 
    message_count = message_count + 1,
    updated_at = NOW(),
    last_model = COALESCE(NEW.model, last_model),
    preview = CASE 
      WHEN message_count = 0 AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 100)
      ELSE preview
    END,
    title = CASE 
      WHEN title = 'New Chat' AND NEW.role = 'user' 
      THEN LEFT(NEW.content, 50)
      ELSE title
    END
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-updating session
DROP TRIGGER IF EXISTS trigger_update_session_on_message ON public.chat_messages;
CREATE TRIGGER trigger_update_session_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_on_message();

-- ============================================================================
-- RLS Policies for chat_sessions
-- ============================================================================
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sessions" ON public.chat_sessions;
CREATE POLICY "Users view own sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_owner()));

DROP POLICY IF EXISTS "Users create own sessions" ON public.chat_sessions;
CREATE POLICY "Users create own sessions"
  ON public.chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users update own sessions" ON public.chat_sessions;
CREATE POLICY "Users update own sessions"
  ON public.chat_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users delete own sessions" ON public.chat_sessions;
CREATE POLICY "Users delete own sessions"
  ON public.chat_sessions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies for chat_messages
-- ============================================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view messages in own sessions" ON public.chat_messages;
CREATE POLICY "Users view messages in own sessions"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs 
      WHERE cs.id = session_id 
      AND (cs.user_id = (SELECT auth.uid()) OR (SELECT public.is_owner()))
    )
  );

DROP POLICY IF EXISTS "Users insert messages in own sessions" ON public.chat_messages;
CREATE POLICY "Users insert messages in own sessions"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs 
      WHERE cs.id = session_id 
      AND cs.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users update own messages" ON public.chat_messages;
CREATE POLICY "Users update own messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs 
      WHERE cs.id = session_id 
      AND cs.user_id = (SELECT auth.uid())
    )
  );

