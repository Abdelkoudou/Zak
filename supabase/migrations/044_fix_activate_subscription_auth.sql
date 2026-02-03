-- ============================================================================
-- Migration 044: Fix activate_subscription authorization for registration flow
-- ============================================================================
--
-- Problem: During registration, auth.uid() is NULL because no session exists
-- until email is confirmed. This causes activate_subscription to return
-- "Unauthorized" and leaves users in a zombie state (registered but unpaid).
--
-- Solution: Add a 5-minute grace period for registration. Allow activation if:
-- 1. auth.uid() = p_user_id (logged-in user activating for self)
-- 2. OR user profile was created < 5 minutes ago (registration flow)
-- 3. OR caller is admin/owner
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_subscription(p_user_id uuid, p_key_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_duration_days INTEGER;
  v_key_id uuid;
  v_expires_at TIMESTAMPTZ;
  v_user_created_at TIMESTAMPTZ;
BEGIN
  -- ============================================================================
  -- Authorization Guard (Updated for Registration Flow)
  -- ============================================================================
  -- Allow activation if:
  -- 1. Caller is the user being activated (auth.uid() = p_user_id)
  -- 2. OR user profile was created within last 5 minutes (registration grace period)
  -- 3. OR caller is admin/owner
  
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    -- Check registration grace period: profile created < 5 minutes ago
    SELECT created_at INTO v_user_created_at
    FROM public.users
    WHERE id = p_user_id;
    
    -- If user doesn't exist, deny immediately
    IF v_user_created_at IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check if within 5-minute registration grace period
    IF v_user_created_at < NOW() - INTERVAL '5 minutes' THEN
      -- Not in grace period, check if caller is admin/owner
      IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
      ) THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
      END IF;
    END IF;
    -- If within grace period, allow activation to proceed
  END IF;

  -- ============================================================================
  -- Atomic check-and-mark: UPDATE ... RETURNING
  -- This prevents TOCTOU (Time of Check to Time of Use) race conditions
  -- ============================================================================
  UPDATE public.activation_keys
  SET is_used = TRUE,
      used_by = p_user_id,
      used_at = NOW(),
      -- Also set the expiration on the key itself
      expires_at = (NOW() + (duration_days || ' days')::INTERVAL)::DATE + TIME '23:59:59.999'
  WHERE key_code = p_key_code
    AND is_used = FALSE
  RETURNING id, duration_days INTO v_key_id, v_duration_days;

  IF v_key_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already used key');
  END IF;

  -- Calculate expiration timestamp (end of day for the expiration date)
  v_expires_at := (NOW() + (v_duration_days || ' days')::INTERVAL)::DATE + TIME '23:59:59.999';

  -- Update user subscription
  UPDATE public.users
  SET is_paid = TRUE,
      subscription_expires_at = v_expires_at
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true, 
    'duration_days', v_duration_days,
    'expires_at', v_expires_at
  );
END;
$function$;

-- Add comment documenting the security model
COMMENT ON FUNCTION public.activate_subscription (uuid, text) IS 'Activates a subscription for a user using an activation key.
Authorization: Allows activation if (1) caller is the user being activated,
(2) user profile was created within last 5 minutes (registration grace period),
or (3) caller is admin/owner. Uses atomic UPDATE...RETURNING to prevent race conditions.';