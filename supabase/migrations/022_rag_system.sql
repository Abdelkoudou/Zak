-- ============================================================================
-- Migration: RAG System for AI Chat
-- ============================================================================
-- Enables pgvector and creates tables for knowledge base and chat logging
-- ============================================================================

-- Enable pgvector extension (requires Supabase dashboard or superuser)
-- Run this in Supabase SQL Editor if it fails: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Knowledge Base Table (for RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 uses 768 dimensions
  metadata JSONB DEFAULT '{}',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search (use HNSW for better performance)
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
  ON public.knowledge_base 
  USING hnsw (embedding vector_cosine_ops);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS knowledge_base_category_idx 
  ON public.knowledge_base(category);

-- ============================================================================
-- Chat Logs Table (for tracking and improvement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  model_name TEXT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context_used JSONB DEFAULT '[]',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_logs
CREATE INDEX IF NOT EXISTS chat_logs_user_id_idx ON public.chat_logs(user_id);
CREATE INDEX IF NOT EXISTS chat_logs_created_at_idx ON public.chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS chat_logs_model_idx ON public.chat_logs(model);

-- ============================================================================
-- Function: Search Knowledge Base by Similarity
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    (1 - (kb.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.knowledge_base kb
  WHERE 
    kb.embedding IS NOT NULL
    AND (filter_category IS NULL OR kb.category = filter_category)
    AND (1 - (kb.embedding <=> query_embedding)) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- RLS Policies for knowledge_base
-- ============================================================================
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view knowledge base" ON public.knowledge_base;
CREATE POLICY "Anyone can view knowledge base"
  ON public.knowledge_base FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners can insert knowledge base" ON public.knowledge_base;
CREATE POLICY "Owners can insert knowledge base"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_owner()));

DROP POLICY IF EXISTS "Owners can update knowledge base" ON public.knowledge_base;
CREATE POLICY "Owners can update knowledge base"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_owner()));

DROP POLICY IF EXISTS "Owners can delete knowledge base" ON public.knowledge_base;
CREATE POLICY "Owners can delete knowledge base"
  ON public.knowledge_base FOR DELETE
  TO authenticated
  USING ((SELECT public.is_owner()));

-- ============================================================================
-- RLS Policies for chat_logs
-- ============================================================================
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own chat logs" ON public.chat_logs;
CREATE POLICY "Users view own chat logs"
  ON public.chat_logs FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_owner())
  );

DROP POLICY IF EXISTS "Anyone can insert chat logs" ON public.chat_logs;
CREATE POLICY "Anyone can insert chat logs"
  ON public.chat_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can rate own chat logs" ON public.chat_logs;
CREATE POLICY "Users can rate own chat logs"
  ON public.chat_logs FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Owners can delete chat logs" ON public.chat_logs;
CREATE POLICY "Owners can delete chat logs"
  ON public.chat_logs FOR DELETE
  TO authenticated
  USING ((SELECT public.is_owner()));

-- ============================================================================
-- Seed initial knowledge (FMC App specific)
-- ============================================================================
INSERT INTO public.knowledge_base (title, content, category, metadata) VALUES
('About FMC App', 'FMC App is the first educational mobile application designed specifically for medical students at Constantine Medical Faculty and its annexes in Algeria. It provides QCMs from previous years with detailed explanations.', 'about', '{"priority": "high"}'),
('Supported Faculties', 'FMC App supports students from: Faculté de Constantine (Fac Mère), Annexe de Biskra, Annexe d''Oum El Bouaghi, Annexe de Khenchela, and Annexe de Souk Ahras.', 'about', '{"priority": "high"}'),
('Study Years', 'The app covers 3 years of medical education: 1st Year (Anatomie, Biochimie, Biophysique, Physiologie, Cytologie, Embryologie, Histologie), 2nd Year (UEI units, Génétique, Immunologie, Sémiologie), and 3rd Year (Anatomie pathologique, Pharmacologie, Microbiologie).', 'curriculum', '{"priority": "high"}'),
('Exam Types', 'The app includes questions from different exam types: EMD (Examen de Module), EMD1 and EMD2 (Semester exams), and Rattrapage (Resit exams).', 'curriculum', '{"priority": "medium"}'),
('Subscription', 'FMC App uses activation keys for subscription. Users can have up to 2 devices per account. Contact the admin to get an activation key.', 'subscription', '{"priority": "medium"}'),
('Offline Mode', 'FMC App works offline! Download modules for offline study. Your progress syncs when you reconnect.', 'features', '{"priority": "medium"}')
ON CONFLICT DO NOTHING;
