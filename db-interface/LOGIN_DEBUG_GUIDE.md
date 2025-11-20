# Login Issue - Complete Debugging Guide

## Problem
Login page refreshes without logging in. No error messages shown.

## Step-by-Step Debugging

### Step 1: Open Browser Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Try to log in
4. Look for messages like:
   - `User signed in: [user-id]`
   - `User role: admin`
   - `Login successful, redirecting...`
   - Any error messages in red

**What to look for:**
- If you see "User signed in" → Authentication works ✅
- If you see "User role check error" → User not in public.users table ❌
- If you see "Access denied" → Wrong role ❌
- If you see nothing → JavaScript error ❌

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Try to log in
3. Look for these requests:
   - `token?grant_type=password` → Should return 200 ✅
   - `users?select=role` → Should return 200 ✅
   - If any return 400/401/500 → There's an error ❌

### Step 3: Verify User in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check if user exists in BOTH tables
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id as public_user_id,
  pu.role,
  pu.is_paid,
  CASE 
    WHEN pu.id IS NULL THEN '❌ NOT in public.users - THIS IS THE PROBLEM'
    WHEN pu.role NOT IN ('admin', 'owner', 'manager') THEN '❌ Wrong role - no admin access'
    ELSE '✅ User is properly configured'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'qcmadin@gmail.com';
```

**Expected result:**
```
id: 0b16f96d-d23c-4321-98be-97e9f4652b9f
email: qcmadin@gmail.com
public_user_id: 0b16f96d-d23c-4321-98be-97e9f4652b9f
role: admin
is_paid: true
status: ✅ User is properly configured
```

**If public_user_id is NULL:**
```sql
-- Fix: Add user to public.users
INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
VALUES (
  '0b16f96d-d23c-4321-98be-97e9f4652b9f',
  'qcmadin@gmail.com',
  'Admin User',
  'admin',
  true,
  '2099-12-31'::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_paid = true;
```

### Step 4: Check Supabase Connection

Run this in browser console on login page:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

Should show:
```
Supabase URL: https://your-project.supabase.co
Supabase Key exists: true
```

### Step 5: Test Authentication Manually

Run this in browser console on login page:

```javascript
// Test login manually
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Try to sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'qcmadin@gmail.com',
  password: 'your-password'
});

console.log('Auth result:', data);
console.log('Auth error:', error);

// Check user role
if (data.user) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();
  
  console.log('User data:', userData);
  console.log('User error:', userError);
}
```

### Step 6: Check Environment Variables

Verify your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** After changing `.env.local`, restart the dev server!

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

### Step 7: Check RLS Policies

Run this SQL to check if RLS is blocking access:

```sql
-- Check RLS policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing (ONLY FOR DEBUGGING)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Try logging in again

-- Re-enable RLS after testing
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Step 8: Check for JavaScript Errors

In browser console, look for errors like:
- `Uncaught TypeError`
- `Cannot read property`
- `undefined is not a function`

These indicate code errors that prevent login.

## Common Issues & Solutions

### Issue 1: Page Refreshes, No Error
**Cause:** User not in public.users table
**Solution:** Run the INSERT query from Step 3

### Issue 2: "User not found in users table"
**Cause:** User exists in auth.users but not public.users
**Solution:** Run the INSERT query from Step 3

### Issue 3: "Access denied. Role 'student' does not have admin privileges"
**Cause:** User has wrong role
**Solution:**
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'qcmadin@gmail.com';
```

### Issue 4: "Failed to verify user role"
**Cause:** RLS policies blocking access or user doesn't exist
**Solution:** Check Step 7 (RLS policies)

### Issue 5: Infinite Redirect Loop
**Cause:** Middleware redirecting to login, login redirecting to questions
**Solution:** Check middleware.ts config - make sure /login is NOT in matcher

### Issue 6: "Invalid login credentials"
**Cause:** Wrong password or email
**Solution:** Reset password in Supabase Dashboard:
1. Go to Authentication → Users
2. Find user
3. Click "..." → Reset Password
4. Use the reset link

## Quick Fix Script

Run this complete script in Supabase SQL Editor:

```sql
-- Complete fix for login issues
DO $$
DECLARE
  user_id UUID := '0b16f96d-d23c-4321-98be-97e9f4652b9f';
  user_email TEXT := 'qcmadin@gmail.com';
BEGIN
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users. Create user in Supabase Dashboard first.';
  END IF;
  
  -- Add or update user in public.users
  INSERT INTO public.users (id, email, full_name, role, is_paid, subscription_expires_at)
  VALUES (
    user_id,
    user_email,
    'Admin User',
    'admin',
    true,
    '2099-12-31'::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_paid = true,
    subscription_expires_at = '2099-12-31'::timestamptz;
  
  RAISE NOTICE 'User configured successfully!';
END $$;

-- Verify
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'qcmadin@gmail.com'
UNION ALL
SELECT 
  'public.users' as table_name,
  id,
  email || ' (role: ' || role || ')' as email,
  created_at
FROM public.users
WHERE email = 'qcmadin@gmail.com';
```

## Expected Console Output (Success)

When login works, you should see:

```
User signed in: 0b16f96d-d23c-4321-98be-97e9f4652b9f
User role: admin
Login successful, redirecting...
```

Then the page redirects to `/questions`.

## If Still Not Working

1. **Clear browser cache completely**
   - Chrome: Ctrl+Shift+Delete → Clear all
   - Try in Incognito mode

2. **Check Supabase Dashboard**
   - Go to Authentication → Users
   - Verify user exists
   - Check "Last Sign In" timestamp

3. **Restart dev server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Try different browser**
   - Sometimes browser extensions interfere

5. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

## Contact Support

If none of this works, provide:
1. Browser console output (screenshot)
2. Network tab screenshot
3. Result of the verification SQL query
4. Supabase project URL (without keys!)

This will help diagnose the exact issue.
