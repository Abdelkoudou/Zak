-- Migration 036: Exempt Admins and Managers from Device Limit

CREATE OR REPLACE FUNCTION enforce_max_devices()
RETURNS TRIGGER AS $$
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
    AND device_id != NEW.device_id; -- Don't count existing sessions for THIS specific device (if re-registering)

  -- If trying to add a NEW fingerprint and already have 2, block it
  -- We allow matching fingerprints (same physical device) regardless of session count
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
$$ LANGUAGE plpgsql;