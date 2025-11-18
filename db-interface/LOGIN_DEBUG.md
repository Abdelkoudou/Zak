# 🔍 Login Debug Guide

## Issue: Login button does nothing

### Quick Checks

1. **Open Browser Console** (F12 or Right-click → Inspect → Console)
2. **Try to login**
3. **Look for error messages**

---

## Common Issues & Fixes

### Issue 1: "User not found in users table"

**Cause**: The user exists in `auth.users` but not in `public.users`

**Fix**: Run this SQL in Supabase SQL Editor:

```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check if user exists in public.users
SELECT id, email, role FROM public.users WHERE email = 'your-email@example.com';

-- If user is missing from public.users, add them:
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
);
```

### Issue 2: "Failed to verify user role"

**Cause**: RLS policy blocking the role check

**Fix**: Add this RLS policy:

```sql
-- Allow authenticated users to read their own user record
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### Issue 3: "Access denied. Role 'student' does not have admin privileges"

**Cause**: User has wrong role

**Fix**: Update user role:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Issue 4: Console shows "Sign in error"

**Cause**: Wrong email or password

**Fix**: 
1. Double-check email and password
2. Reset password if needed:

```sql
-- In Supabase Dashboard → Authentication → Users
-- Click on user → Reset Password
```

---

## Step-by-Step Debug

### Step 1: Verify User Exists

```sql
-- Run in Supabase SQL Editor
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'your-email@example.com';
```

**Expected Result:**
```
id: some-uuid
email: your-email@example.com
email_confirmed_at: 2024-xx-xx (not null)
role: admin
```

**If role is NULL:**
```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 2: Check RLS Policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';
```

**If rowsecurity is true**, add read policy:

```sql
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### Step 3: Test Login in Console

Open browser console and run:

```javascript
// Test Supabase connection
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

## Complete Fix Script

Run this in Supabase SQL Editor:

```sql
-- 1. Check user exists
DO $$
DECLARE
  user_email TEXT := 'admin@example.com'; -- Change this
  user_password TEXT := 'admin123'; -- Change this
  user_id UUID;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- If not, create user
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, recovery_sent_at, last_sign_in_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}', NOW(), NOW(), NOW(), NOW(),
      '', '', '', ''
    ) RETURNING id INTO user_id;
    
    RAISE NOTICE 'Created user in auth.users: %', user_id;
  ELSE
    RAISE NOTICE 'User already exists in auth.users: %', user_id;
  END IF;

  -- Ensure user exists in public.users with admin role
  INSERT INTO public.users (id, email, role)
  VALUES (user_id, user_email, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
  
  RAISE NOTICE 'User configured in public.users with admin role';
END $$;

-- 2. Add RLS policy for reading own user record
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 3. Verify setup
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  pu.role,
  CASE 
    WHEN pu.role IN ('owner', 'admin', 'manager') THEN '✅ Can login'
    ELSE '❌ Cannot login'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'admin@example.com'; -- Change this
```

---

## Test Login

1. **Restart dev server:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

2. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
   - Or use Incognito mode

3. **Try login again:**
   - Go to: http://localhost:3001/login
   - Enter email and password
   - Click "Sign in"
   - Check console for messages

---

## Success Indicators

When login works, you should see in console:

```
User signed in: some-uuid-here
User role: admin
Login successful, redirecting...
```

Then you'll be redirected to `/questions`

---

## Still Not Working?

1. **Check .env.local has correct credentials:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tkthvgvjecihqfnknosj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

2. **Restart dev server after any .env changes**

3. **Check Supabase Dashboard → Authentication → Users**
   - User should exist
   - Email should be confirmed

4. **Check Supabase Dashboard → Database → users table**
   - User should exist with admin role

---

**Need more help?** Check the browser console for specific error messages and search for them in this guide.
