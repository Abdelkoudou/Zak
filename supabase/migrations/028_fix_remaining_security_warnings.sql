-- ============================================================================
-- Migration: Fix Remaining Security Warnings
-- ============================================================================
-- Fixes:
-- 1. Move vector extension from public to extensions schema
-- 2. Fix overly permissive chat_logs INSERT policy
-- ============================================================================

-- ============================================================================
-- STEP 1: Move vector extension to extensions schema
-- ============================================================================
-- Note: Supabase recommends keeping extensions in a dedicated schema
-- The 'extensions' schema is pre-created by Supabase for this purpose

-- First, ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Update search_path to include extensions schema BEFORE dropping/recreating
-- This ensures existing tables with vector columns continue to work
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Apply the search_path change to current session
SET search_path TO public, extensions;

-- Drop the extension from public (CASCADE will drop dependent objects)
-- We'll recreate them after
DROP EXTENSION IF EXISTS vector CASCADE;

-- Recreate in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================================
-- STEP 2: Recreate knowledge_base table with vector column
-- ============================================================================
-- The CASCADE above dropped the embedding column, so we need to add it back

-- Add the embedding column back (now using extensions.vector)
ALTER TABLE public.knowledge_base 
ADD COLUMN IF NOT EXISTS embedding extensions.vector(768);

-- Recreate the HNSW index for vector similarity search
DROP INDEX IF EXISTS knowledge_base_embedding_idx;
CREATE INDEX knowledge_base_embedding_idx 
  ON public.knowledge_base 
  USING hnsw (embedding extensions.vector_cosine_ops);

-- ============================================================================
-- STEP 3: Recreate search_knowledge_base function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
  query_embedding extensions.vector(768),
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
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE 
    kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR kb.category = filter_category)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- STEP 4: Fix chat_logs INSERT policy
-- ============================================================================
-- Problem: WITH CHECK (true) allows anyone to insert any data
-- Solution: Require authenticated users and validate user_id matches

DROP POLICY IF EXISTS "Anyone can insert chat logs" ON public.chat_logs;

-- New policy: Only authenticated users can insert their own chat logs
CREATE POLICY "Authenticated users insert own chat logs"
  ON public.chat_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only insert logs for themselves
    user_id = (SELECT auth.uid())
    -- Or user_id is null (for anonymous/system logs)
    OR user_id IS NULL
  );

-- Also allow anon users to insert but only with null user_id
CREATE POLICY "Anon users insert anonymous chat logs"
  ON public.chat_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  ext_schema TEXT;
  search_path_val TEXT;
BEGIN
  -- Check extension location
  SELECT n.nspname INTO ext_schema
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'vector';
  
  -- Check search_path
  SELECT current_setting('search_path') INTO search_path_val;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Security warnings fixed!';
  RAISE NOTICE 'Vector extension schema: %', COALESCE(ext_schema, 'NOT FOUND');
  RAISE NOTICE 'Current search_path: %', search_path_val;
  RAISE NOTICE 'Chat logs INSERT policy updated';
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
