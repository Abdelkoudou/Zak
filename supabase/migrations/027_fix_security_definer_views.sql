-- ============================================================================
-- Migration: Fix Security Definer Views
-- ============================================================================
-- Problem: Views are using SECURITY DEFINER which bypasses RLS policies.
-- These views should use SECURITY INVOKER to respect the querying user's permissions.
-- 
-- Affected views:
-- - public.chat_analytics
-- - public.question_report_stats
-- - public.top_topics
-- - public.model_usage_stats
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop and recreate chat_analytics with SECURITY INVOKER
-- ============================================================================
DROP VIEW IF EXISTS public.chat_analytics;

CREATE VIEW public.chat_analytics
WITH (security_invoker = true)
AS
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
-- STEP 2: Drop and recreate model_usage_stats with SECURITY INVOKER
-- ============================================================================
DROP VIEW IF EXISTS public.model_usage_stats;

CREATE VIEW public.model_usage_stats
WITH (security_invoker = true)
AS
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
-- STEP 3: Drop and recreate top_topics with SECURITY INVOKER
-- ============================================================================
DROP VIEW IF EXISTS public.top_topics;

CREATE VIEW public.top_topics
WITH (security_invoker = true)
AS
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
-- STEP 4: Drop and recreate question_report_stats with SECURITY INVOKER
-- ============================================================================
DROP VIEW IF EXISTS public.question_report_stats;

CREATE VIEW public.question_report_stats
WITH (security_invoker = true)
AS
SELECT
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
  COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports,
  COUNT(DISTINCT question_id) as unique_questions_reported,
  COUNT(DISTINCT user_id) as unique_reporters
FROM public.question_reports;

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================
GRANT SELECT ON public.chat_analytics TO authenticated;
GRANT SELECT ON public.model_usage_stats TO authenticated;
GRANT SELECT ON public.top_topics TO authenticated;
GRANT SELECT ON public.question_report_stats TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM pg_views 
  WHERE schemaname = 'public'
  AND viewname IN ('chat_analytics', 'model_usage_stats', 'top_topics', 'question_report_stats');
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Security definer views fixed!';
  RAISE NOTICE 'Views updated with SECURITY INVOKER: %', view_count;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
