-- Migration 043: Fix activate_subscription function column name bug
--
-- ISSUE: The function was using 'duration_months' column but the actual column is 'duration_days'
-- This caused activation attempts to fail silently with the error:
-- "column activation_keys.duration_months does not exist"
--
-- IMPACT: Users who tried to activate codes would get failures
-- FIX: Updated to use duration_days and calculate expiration correctly

CREATE OR REPLACE FUNCTION public.activate_subscription(p_user_id uuid, p_key_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_duration_days INTEGER;
  v_key_id uuid;
  v_expires_at TIMESTAMPTZ;
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
$$;

-- Add a comment to document the function
COMMENT ON FUNCTION public.activate_subscription (uuid, text) IS 'Activates a subscription using an activation key. 
Atomic operation that marks the key as used and updates user subscription.
Returns JSON with success status, duration_days, and expires_at.
Authorization: User can only activate for themselves, or admins can activate for anyone.';