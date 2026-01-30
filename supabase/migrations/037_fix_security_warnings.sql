-- Migration 037: Fix Security Warnings from Supabase Advisor
-- Fixes:
-- 1. enforce_max_devices function has mutable search_path
-- 2. vector extension in public schema (move to extensions)
-- 3. chat_logs RLS allows unrestricted INSERT

-- ============================================================================
-- FIX 1: Add SECURITY DEFINER and SET search_path to enforce_max_devices
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_max_devices()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Immutable search_path for security
AS $$
DECLARE
  physical_device_count INTEGER;
BEGIN
  -- Skip enforcement for admins, owners, managers, or reviewers
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.user_id 
    AND (role IN ('admin', 'owner', 'manager') OR is_reviewer = true)
  ) THEN
    RETURN NEW;
  END IF;

  -- Count unique physical devices (fingerprints) for this user
  SELECT COUNT(DISTINCT fingerprint) INTO physical_device_count
  FROM public.device_sessions
  WHERE user_id = NEW.user_id
    AND device_id != NEW.device_id;

  -- If trying to add a NEW fingerprint and already have 2, block it
  IF physical_device_count >= 2 AND NOT EXISTS (
    SELECT 1 FROM public.device_sessions
    WHERE user_id = NEW.user_id
    AND fingerprint = NEW.fingerprint
  ) THEN
    RAISE EXCEPTION 'DEVICE_LIMIT_EXCEEDED'
      USING DETAIL = '🔴 Limite d''appareils atteinte. Vous êtes déjà connecté sur 2 appareils';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX 2: Move vector extension to extensions schema
-- NOTE: This requires the extensions schema to exist and may need manual
-- verification in Supabase Dashboard if it fails
-- ============================================================================

DO $$
BEGIN
  -- Check if vector extension exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'vector' 
    AND extnamespace = 'public'::regnamespace
  ) THEN
    -- Move to extensions schema
    ALTER EXTENSION vector SET SCHEMA extensions;
    RAISE NOTICE 'Moved vector extension to extensions schema';
  ELSE
    RAISE NOTICE 'Vector extension not in public schema, skipping';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not move vector extension: %. Manual intervention may be required.', SQLERRM;
END $$;

-- ============================================================================
-- FIX 3: Replace overly permissive chat_logs INSERT policy
-- ============================================================================

-- Drop the permissive policy
DROP POLICY IF EXISTS "Anyone can insert chat logs" ON public.chat_logs;

-- Create a proper authenticated-only policy with user check
CREATE POLICY "Authenticated users insert own chat logs" ON public.chat_logs FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = user_id);

-- ============================================================================
-- Also fix other security definer functions that may have mutable search_path
-- ============================================================================

-- Fix is_admin_or_higher function
CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- Fix is_manager_or_higher function
CREATE OR REPLACE FUNCTION public.is_manager_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
  );
END;
$$;

-- Fix is_owner function
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'owner'
  );
END;
$$;

-- Fix is_paid_user function
CREATE OR REPLACE FUNCTION public.is_paid_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_paid = TRUE
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$;

-- Fix activate_subscription function
-- Secure and atomic implementation to prevent TOCTOU and search_path vulnerabilities
-- Documented: This function is intended to be called via RPC from the User application
CREATE OR REPLACE FUNCTION public.activate_subscription(p_user_id uuid, p_key_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_duration_months INTEGER;
  v_key_id uuid;
BEGIN
  -- Authorization guard: caller must be activating for themselves
  -- OR caller must be an admin (though typically this is a user-facing RPC)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    -- Check if caller is admin/owner
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  -- Atomic check-and-mark: UPDATE ... RETURNING
  -- This prevents TOCTOU (Time of Check to Time of Use) race conditions
  UPDATE public.activation_keys
  SET is_used = TRUE,
      used_by = p_user_id,
      used_at = NOW()
  WHERE key_code = p_key_code
    AND is_used = FALSE
  RETURNING id, duration_months INTO v_key_id, v_duration_months;

  IF v_key_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already used key');
  END IF;

  -- Update user subscription
  UPDATE public.users
  SET is_paid = TRUE,
      subscription_expires_at = NOW() + (v_duration_months || ' months')::INTERVAL
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'duration_months', v_duration_months);
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  warning_count INTEGER := 0;
BEGIN
  -- Check if enforce_max_devices has proper search_path
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'enforce_max_devices'
    AND (
      p.proconfig IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS cfg 
        WHERE cfg LIKE 'search_path=%'
      )
    )
  ) THEN
    warning_count := warning_count + 1;
    RAISE WARNING 'enforce_max_devices may still have mutable search_path';
  END IF;

  RAISE NOTICE '✅ Migration 037 completed. Warnings: %', warning_count;
END $$;