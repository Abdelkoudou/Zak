# Device Management & 2-Device Limit

## Overview

The MCQ Study App enforces a strict 2-device limit per user to prevent subscription sharing while allowing legitimate multi-device usage (e.g., phone + tablet).

## How It Works

### Database Level Enforcement
- **PostgreSQL Trigger**: `enforce_max_devices()` automatically removes the oldest device when a 3rd device attempts to register
- **Unique Constraint**: `UNIQUE(user_id, device_id)` prevents duplicate registrations
- **Automatic Cleanup**: No manual intervention required - the system handles device limits automatically

### Device Identification
- **Device ID**: Generated from device type, name, OS, and version using Expo Device API
- **Device Name**: Human-readable format like "iPhone 14 (iOS)" or "Pixel 7 (Android)"
- **Session Tracking**: Last active timestamp updated on each login

### User Experience

#### Login Flow
1. User enters credentials
2. System checks existing device count
3. If 3rd device: Shows warning "Limite d'appareils atteinte"
4. Oldest device session automatically removed
5. New device registered successfully

#### Device Management UI
- **Profile Screen**: Shows "Appareils connectés (X/2)" section
- **Device List**: Displays device name and last activity time
- **Manual Removal**: Users can remove devices with confirmation dialog
- **Real-time Updates**: Device list refreshes after changes

## Implementation Details

### Key Files
- `src/lib/auth.ts` - Device registration and session management
- `src/context/AuthContext.tsx` - Authentication state with device functions
- `app/(auth)/login.tsx` - Login with device limit warnings
- `app/(tabs)/profile.tsx` - Device management UI
- `supabase/schema.sql` - Database trigger for 2-device enforcement

### API Functions
```typescript
// Register current device (called on login)
await registerDevice(userId: string)

// Get user's device sessions
const { sessions } = await getDeviceSessions(userId: string)

// Remove specific device
await removeDevice(sessionId: string)
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
1. Login on Device A → Should succeed (1/2 devices)
2. Login on Device B → Should succeed (2/2 devices)  
3. Login on Device C → Should show warning, Device A removed (2/2 devices)
4. Check Profile → Should only show Device B and C
5. Remove Device B → Should show only Device C (1/2 devices)

### Verification Queries
```sql
-- Check device count per user (should never exceed 2)
SELECT user_id, COUNT(*) as device_count 
FROM device_sessions 
GROUP BY user_id 
HAVING COUNT(*) > 2;

-- View all sessions for a user
SELECT * FROM device_sessions 
WHERE user_id = '[USER_ID]' 
ORDER BY last_active_at DESC;
```

## Security Features

### Row-Level Security (RLS)
- Users can only view/manage their own device sessions
- Admins can view all device sessions for support
- Prevents unauthorized access to other users' device data

### Automatic Enforcement
- No client-side validation required
- Database trigger ensures limit cannot be bypassed
- Works even if app logic is modified or bypassed

## User Benefits

### Legitimate Use Cases
- ✅ Phone + Tablet usage
- ✅ Upgrading devices
- ✅ Temporary device access

### Prevented Abuse
- ❌ Account sharing among multiple students
- ❌ Selling access to multiple users
- ❌ Unlimited device registrations

## Troubleshooting

### Common Issues
1. **"Device limit reached" on same device**: Clear app data or reinstall
2. **Can't login on new device**: Remove old device from Profile > Device Management
3. **Device shows as "Unknown"**: Normal for some emulators/simulators

### Admin Support
- Admins can view all user device sessions via database
- Can manually remove problematic device sessions if needed
- Monitor for suspicious patterns (rapid device switching)