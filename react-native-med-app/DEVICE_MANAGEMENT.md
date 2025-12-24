# Device Management & Strict 2-Device Limit

## Overview

The MCQ Study App enforces a **strict 2-device limit** per user. Users cannot login from a 3rd device - they must use one of their registered devices only.

## How It Works

### Strict Enforcement
- **Maximum 2 devices**: Each user can only use 2 devices
- **Login blocked on 3rd device**: Attempting to login from a 3rd device will fail with an error message
- **No manual deletion**: Users cannot remove devices themselves
- **View-only device list**: Users can see their connected devices but cannot modify them

### Device Identification
- **Device ID**: Generated from device type, name, OS, and version using Expo Device API
- **Device Name**: Human-readable format like "iPhone 14 (iOS)" or "Pixel 7 (Android)"
- **Session Tracking**: Last active timestamp updated on each login

### User Experience

#### Login Flow
1. User enters credentials
2. System checks existing device count
3. **If 3rd device**: Login is **blocked** with error message
4. **If registered device**: Login succeeds normally
5. **If 1st or 2nd device**: Login succeeds and device is registered

#### Error Message on 3rd Device
```
Limite d'appareils atteinte. Vous ne pouvez utiliser que 2 appareils maximum. 
Veuillez vous déconnecter d'un autre appareil pour continuer.
```

#### Device Management UI
- **Profile Screen**: Shows "Appareils connectés (X/2)" section
- **Device List**: Displays device names (e.g., "iPhone 14 (iOS)")
- **Last Activity**: Shows relative time (e.g., "Il y a 2h")
- **Info Message**: Explains the 2-device limit policy
- **No Delete Button**: Users cannot remove devices

## Implementation Details

### Key Files
- `src/lib/auth.ts` - Device validation and login blocking
- `src/context/AuthContext.tsx` - Authentication state management
- `app/(auth)/login.tsx` - Login with device limit error handling
- `app/(tabs)/profile.tsx` - View-only device list UI
- `supabase/schema.sql` - Database schema for device sessions

### API Functions
```typescript
// Check device count and block login if limit reached
const { user, error } = await signIn(email, password)
// Returns error if 3rd device attempts login

// Get user's device sessions (view only)
const { sessions } = await getDeviceSessions(userId)
```

### Database Schema
```sql
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id TEXT NOT NULL,
  device_name TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);
```

## Testing

### Manual Testing Steps
1. **Login on Device A** → Should succeed (1/2 devices)
2. **Login on Device B** → Should succeed (2/2 devices)  
3. **Login on Device C** → Should **FAIL** with error message
4. **Check Profile on Device A or B** → Should show both devices (2/2)
5. **Try Device C again** → Should still fail

### Verification Queries
```sql
-- Check device count per user (should never exceed 2)
SELECT user_id, COUNT(*) as device_count 
FROM device_sessions 
GROUP BY user_id;

-- View all sessions for a user
SELECT * FROM device_sessions 
WHERE user_id = '[USER_ID]' 
ORDER BY last_active_at DESC;
```

## Security Features

### Strict Access Control
- **No bypass possible**: Login is blocked at authentication level
- **No manual deletion**: Users cannot remove their own devices
- **Admin-only management**: Only admins can remove device sessions if needed
- **Database-level tracking**: All device sessions recorded in database

### Row-Level Security (RLS)
- Users can only view their own device sessions
- Users cannot delete or modify device sessions
- Admins can view and manage all device sessions for support

## User Benefits

### Clear Limitations
- ✅ Use on exactly 2 devices (phone + tablet, etc.)
- ✅ Clear error message when limit reached
- ✅ View which devices are registered
- ❌ Cannot add 3rd device without admin help
- ❌ Cannot remove devices themselves

### Prevented Abuse
- ❌ Account sharing among multiple students
- ❌ Selling access to multiple users
- ❌ Unlimited device registrations
- ❌ Device hopping to bypass limits

## Admin Support

### How Admins Can Help
If a user needs to change devices:
1. Admin accesses Supabase database
2. Admin removes old device session manually
3. User can then login on new device

### Database Query for Admins
```sql
-- Remove specific device session
DELETE FROM device_sessions 
WHERE id = '[SESSION_ID]';

-- Remove all sessions for a user (reset)
DELETE FROM device_sessions 
WHERE user_id = '[USER_ID]';
```

## Troubleshooting

### Common Issues
1. **"Device limit reached" error**: User already has 2 devices registered - contact admin
2. **Can't login on new device**: Need admin to remove old device first
3. **Lost access to old device**: Contact admin to remove that device session

### User Instructions
If you need to use a new device:
1. Contact support/admin
2. Provide your email and new device information
3. Admin will remove old device
4. You can then login on new device