# 🔐 Security Fix: Session Management & Auto-Logout

## Problem
- Sessions persist indefinitely (even after days)
- No automatic logout after inactivity
- No session expiry validation
- Security risk: Unattended computers remain logged in

## Solution Overview

We'll implement:
1. **Session timeout** - Auto-logout after 24 hours
2. **Inactivity timeout** - Auto-logout after 30 minutes of inactivity
3. **Session validation** - Check session validity on every page load
4. **Token refresh** - Refresh tokens before expiry
5. **Supabase JWT settings** - Configure proper token expiration

---

## Implementation Steps

### Step 1: Configure Supabase JWT Settings

Go to Supabase Dashboard → Settings → Auth → JWT Settings:

**Recommended Settings:**
- **JWT expiry limit**: `3600` (1 hour)
- **Refresh token expiry**: `86400` (24 hours)
- **Enable automatic token refresh**: ✅ Yes

### Step 2: Update Supabase Client with Session Options

### Step 3: Add Session Validation Hook

### Step 4: Add Inactivity Timeout

### Step 5: Update Middleware with Session Checks

---

## Files to Create/Modify

1. `db-interface/lib/supabase.ts` - Add session config
2. `db-interface/hooks/useAuth.ts` - New auth hook
3. `db-interface/app/layout.tsx` - Add session provider
4. `db-interface/middleware.ts` - Enhanced session checks
5. `db-interface/components/SessionManager.tsx` - New component

---

## Security Settings Summary

| Setting | Value | Purpose |
|---------|-------|---------|
| JWT Expiry | 1 hour | Access token lifetime |
| Refresh Token Expiry | 24 hours | Maximum session duration |
| Inactivity Timeout | 30 minutes | Auto-logout when idle |
| Session Validation | On every route | Verify session validity |
| Auto Refresh | Enabled | Refresh before expiry |

---

## User Experience

**Before:**
- Login once, stay logged in forever
- No logout on inactivity
- Security risk

**After:**
- Auto-logout after 24 hours (max)
- Auto-logout after 30 minutes of inactivity
- Session refreshes automatically while active
- Secure and user-friendly
