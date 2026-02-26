-- ============================================================================
-- Migration: Atomic RPC functions for subscription plan operations
-- ============================================================================
-- Replaces the TOCTOU-vulnerable check-then-act patterns in the
-- application layer with atomic database operations.
--
-- Authorization: These functions are SECURITY DEFINER so they can bypass
-- RLS. An in-body owner check gates access when called by a non-service-role
-- client (auth.uid() is NULL for service-role calls, which are trusted).
-- ============================================================================

-- ============================================================================
-- STEP 1: toggle_plan_active – atomic toggle with last-active-plan guard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.toggle_plan_active(plan_id UUID)
RETURNS SETOF public.subscription_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_plan public.subscription_plans;
  active_count INTEGER;
BEGIN
  -- Authorization: allow service-role (auth.uid() IS NULL) or owner users
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Permission denied: only owners can toggle plans'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  -- Lock the target row to prevent concurrent modifications
  SELECT * INTO target_plan
  FROM public.subscription_plans
  WHERE id = plan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found'
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- If deactivating, ensure at least one other active plan remains
  -- Lock all active rows to serialize concurrent deactivation attempts
  IF target_plan.is_active THEN
    SELECT COUNT(*) INTO active_count
    FROM public.subscription_plans
    WHERE is_active = true
    FOR UPDATE;

    IF active_count <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last active plan'
        USING ERRCODE = 'P0001'; -- raise_exception
    END IF;
  END IF;

  -- Perform the toggle
  RETURN QUERY
  UPDATE public.subscription_plans
  SET
    is_active = NOT target_plan.is_active,
    updated_at = NOW()
  WHERE id = plan_id
  RETURNING *;
END;
$$;

-- ============================================================================
-- STEP 2: delete_plan_safe – atomic delete with existence & last-active guard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_plan_safe(plan_id UUID)
RETURNS SETOF public.subscription_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_plan public.subscription_plans;
  active_count INTEGER;
BEGIN
  -- Authorization: allow service-role (auth.uid() IS NULL) or owner users
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Permission denied: only owners can delete plans'
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;

  -- Lock the target row
  SELECT * INTO target_plan
  FROM public.subscription_plans
  WHERE id = plan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found'
      USING ERRCODE = 'P0002'; -- no_data_found
  END IF;

  -- If the plan is active, ensure it's not the last one
  -- Lock all active rows to serialize concurrent delete attempts
  IF target_plan.is_active THEN
    SELECT COUNT(*) INTO active_count
    FROM public.subscription_plans
    WHERE is_active = true
    FOR UPDATE;

    IF active_count <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last active plan'
        USING ERRCODE = 'P0001'; -- raise_exception
    END IF;
  END IF;

  -- Delete and return the deleted row
  RETURN QUERY
  DELETE FROM public.subscription_plans
  WHERE id = plan_id
  RETURNING *;
END;
$$;

-- ============================================================================
-- STEP 3: Grant execute to authenticated users
-- Authorization is enforced inside each function body (owner role check).
-- Service-role calls (supabaseAdmin) bypass auth.uid() and are trusted.
-- ============================================================================
GRANT
EXECUTE ON FUNCTION public.toggle_plan_active (UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.delete_plan_safe (UUID) TO authenticated;