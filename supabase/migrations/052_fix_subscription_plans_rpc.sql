-- ============================================================================
-- Migration: Fix toggle_plan_active and delete_plan_safe RPCs
-- ============================================================================
-- The previous version used 'FOR UPDATE' with 'COUNT(*)', which is not
-- allowed in PostgreSQL (ERROR: 0A000). This version separates row locking
-- from counting to ensure correctness and atomicity.
-- ============================================================================

-- STEP 1: toggle_plan_active – fixed atomic toggle
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
  IF target_plan.is_active THEN
    -- Lock all active rows to serialize concurrent deactivation attempts
    PERFORM 1 FROM public.subscription_plans WHERE is_active = true FOR UPDATE;
    
    -- Now safe to count (rows are locked)
    SELECT COUNT(*) INTO active_count
    FROM public.subscription_plans
    WHERE is_active = true;

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

-- STEP 2: delete_plan_safe – fixed atomic delete
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
  IF target_plan.is_active THEN
    -- Lock all active rows to serialize concurrent delete attempts
    PERFORM 1 FROM public.subscription_plans WHERE is_active = true FOR UPDATE;

    -- Now safe to count
    SELECT COUNT(*) INTO active_count
    FROM public.subscription_plans
    WHERE is_active = true;

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
