# Fix: Multiple Login Sessions Issue

## Problem Analysis

You're experiencing "session expired" when logging in from a second PC. After investigation:

1. ✅ The `device_sessions` table **does NOT exist** in your database (not in migrations)
2. ✅ The device limit is **NOT active** - it's only in schema.sql but never applied
3. ❌ The issue is **Supabase Auth's default session behavior**

## Root Cause

**Supabase Auth by default allows multiple sessions**, but your issue is likely caused by:

1. **Token expiration** - Tokens expire and need refresh
2. **Browser/localStorage conflicts** - Sessions stored locally
3. **Network issues** - Token refresh failing
4. **SessionManager timeout** - 60-minute inactivity timeout

## Solution 1: Check Supabase Auth Settings (Recommended)

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Settings**

### Step 2: Check Session Settings

Look for these settings:
- **JWT Expiry**: Should be at least 3600 seconds (1 hour)
- **Refresh Token Rotation**: Should be enabled
- **Reuse Interval**: Set to 10 seconds or more

### Step 3: Adjust Settings

```
JWT Expiry: 3600 (1 hour)
Refresh Token Rotation: Enabled
Reuse Interval: 10
```

## Solution 2: Increase Session Timeout in SessionManager

The SessionManager has a 60-minute inactivity timeout. Increase it:

### File: `db-interface/components/SessionManager.tsx`

Change line 8:
```typescript
// Before
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes

// After
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
```

## Solution 3: Disable SessionManager (Temporary Test)

To test if SessionManager is causing the issue:

### File: `db-interface/app/layout.tsx`

Comment out the SessionManager:
```typescript
// <SessionManager />
```

Then test logging in on both PCs. If it works, the issue is the SessionManager timeout.

## Solution 4: Check Browser Console for Errors

When you get "session expired":

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors like:
   - `❌ Invalid session detected`
   - `⏰ Token expired`
   - `⏰ Inactivity timeout reached`

This will tell you exactly what's causing the logout.

## Solution 5: Clear Browser Cache and Test

Sometimes old sessions cause conflicts:

1. **PC 1**: Clear browser cache and cookies
2. **PC 1**: Log in fresh
3. **PC 2**: Clear browser cache and cookies
4. **PC 2**: Log in fresh
5. Test if both stay logged in

## Testing Steps

### Test 1: Basic Multi-Session
1. **PC 1**: Log in → Should work ✅
2. **PC 2**: Log in → Should work ✅
3. **PC 1**: Refresh page → Should still be logged in ✅
4. **PC 2**: Refresh page → Should still be logged in ✅

### Test 2: Token Refresh
1. **PC 1**: Log in
2. Wait 30 minutes
3. **PC 1**: Click around (trigger activity)
4. Should see in console: `✅ Token refreshed successfully`

### Test 3: Inactivity Timeout
1. **PC 1**: Log in
2. Don't touch anything for 60 minutes
3. Should see: `⏰ Session expired due to inactivity`
4. This is expected behavior

## Recommended Configuration

### For Admin Panel (db-interface):

```typescript
// SessionManager.tsx
const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
```

### For Supabase Auth:

```
JWT Expiry: 3600 seconds (1 hour)
Refresh Token Rotation: Enabled
Reuse Interval: 10 seconds
```

## Quick Fix (Apply Now)

Run this to increase session timeout:

1. Open `db-interface/components/SessionManager.tsx`
2. Change line 8 to:
   ```typescript
   const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
   ```
3. Save and restart dev server

This will allow admins to stay logged in for 8 hours instead of 1 hour.

## Verification

After applying the fix:

1. Log in on PC 1
2. Log in on PC 2
3. Both should work simultaneously
4. No "session expired" errors
5. Sessions last 8 hours of inactivity

## Important Notes

- **Device sessions table doesn't exist** - No device limit is active
- **Multiple logins are allowed** - Supabase Auth supports this by default
- **Issue is likely timeout-related** - Not a device limit issue
- **SessionManager is the culprit** - 60-minute timeout is too short for admins

## Next Steps

1. ✅ Increase INACTIVITY_TIMEOUT to 8 hours
2. ✅ Check Supabase Auth settings
3. ✅ Test on both PCs
4. ✅ Monitor browser console for errors

This should fix your issue! 🎉
