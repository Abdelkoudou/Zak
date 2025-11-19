# Fix: Allow Multiple Admin Sessions

## Problem
Admin users can't log in on multiple PCs simultaneously. When logging in on PC 2, PC 1's session expires.

## Root Cause
Supabase Auth by default may limit concurrent sessions, or the device_sessions table is interfering.

## Solutions

### Solution 1: Disable Device Session Tracking for Admins (Recommended)

Since the db-interface is an admin panel (not the student mobile app), admins should be able to log in from multiple locations.

#### Step 1: Check if device_sessions table exists

```sql
-- Run in Supabase SQL Editor
SELECT * FROM device_sessions LIMIT 5;
```

If the table exists and has data, it might be interfering.

#### Step 2: Exempt admins from device limits

Add this to your Supabase database:

```sql
-- Modify the enforce_max_devices function to skip admins
CREATE OR REPLACE FUNCTION enforce_max_devices()
RETURNS TRIGGER AS $$
DECLARE
  device_count INTEGER;
  user_role TEXT;
BEGIN
  -- Check if user is admin/owner
  SELECT role INTO user_role
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Skip device limit for admins and owners
  IF user_role IN ('admin', 'owner', 'manager') THEN
    RETURN NEW;
  END IF;
  
  -- For students, enforce 2 device limit
  SELECT COUNT(*) INTO device_count
  FROM public.device_sessions
  WHERE user_id = NEW.user_id;
  
  IF device_count >= 2 THEN
    -- Delete oldest session
    DELETE FROM public.device_sessions
    WHERE id = (
      SELECT id FROM public.device_sessions
      WHERE user_id = NEW.user_id
      ORDER BY last_active_at ASC
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Solution 2: Configure Supabase Auth for Multiple Sessions

#### In Supabase Dashboard:

1. Go to **Authentication** → **Settings**
2. Look for **"Session Management"** or **"Concurrent Sessions"**
3. Enable **"Allow multiple sessions per user"**

### Solution 3: Increase Session Timeout

The SessionManager in db-interface has a 60-minute inactivity timeout. You can increase it:

```typescript
// In db-interface/components/SessionManager.tsx
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours instead of 1 hour
```

### Solution 4: Remove Device Session Tracking from Admin Panel

If device sessions are only needed for the mobile app (students), remove them from the admin panel entirely.

#### Update middleware.ts to skip device session checks:

```typescript
// db-interface/middleware.ts
// Remove any device session validation for admin users
```

## Testing

After applying Solution 1:

1. Log in on PC 1
2. Log in on PC 2 with same credentials
3. Both should remain logged in ✅
4. No "session expired" errors ✅

## Verification

```sql
-- Check active sessions for a user
SELECT 
  ds.*,
  u.email,
  u.role
FROM device_sessions ds
JOIN users u ON u.id = ds.user_id
WHERE u.email = 'your-admin-email@example.com';

-- Should show multiple sessions for admins
```

## Recommendation

For the **db-interface (admin panel)**:
- ✅ Allow unlimited sessions for admins
- ✅ Admins need to work from multiple locations

For the **mobile app (students)**:
- ✅ Keep 2-device limit
- ✅ Prevents account sharing

## Implementation Priority

1. **High Priority**: Apply Solution 1 (exempt admins from device limits)
2. **Medium Priority**: Configure Supabase for multiple sessions
3. **Low Priority**: Increase session timeout

This will allow admins to work from multiple PCs while still enforcing device limits for students.
