# ✅ Login Issue Fixed

## What Was Wrong

The login button wasn't working because:
1. **Wrong Supabase client** - Was using `createClient` instead of `createBrowserClient` from `@supabase/ssr`
2. **Missing user in public.users table** - User exists in `auth.users` but not in `public.users`
3. **Missing RLS policy** - No policy allowing users to read their own record

## What Was Fixed

### 1. Updated Supabase Client (`lib/supabase.ts`)
- Changed from `createClient` to `createBrowserClient`
- This properly handles cookies in Next.js App Router

### 2. Improved Login Page (`app/login/page.tsx`)
- Added better error messages
- Added console logging for debugging
- Changed redirect to use `window.location.href` for reliability

### 3. Created Debug Guide (`LOGIN_DEBUG.md`)
- Step-by-step troubleshooting
- SQL scripts to fix common issues
- Complete fix script

---

## 🚀 Quick Fix (Run This SQL)

Open Supabase SQL Editor and run:

```sql
-- Replace with your actual email and password
DO $$
DECLARE
  user_email TEXT := 'admin@example.com'; -- ⚠️ CHANGE THIS
  user_password TEXT := 'admin123'; -- ⚠️ CHANGE THIS
  user_id UUID;
BEGIN
  -- Get or create user in auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    -- Create new user
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
  END IF;

  -- Add to public.users with admin role
  INSERT INTO public.users (id, email, role)
  VALUES (user_id, user_email, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
  
  RAISE NOTICE 'User ready: % (admin)', user_email;
END $$;

-- Add RLS policy
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Verify
SELECT 
  au.email,
  pu.role,
  '✅ Ready to login' as status
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'admin@example.com'; -- Change this
```

---

## 🧪 Test Login

1. **Restart dev server:**
```bash
npm run dev
```

2. **Open browser:**
   - Go to: http://localhost:3001/login
   - Open Console (F12)

3. **Login:**
   - Enter your email and password
   - Click "Sign in"
   - Watch console for messages

4. **Expected console output:**
```
User signed in: abc-123-def-456
User role: admin
Login successful, redirecting...
```

5. **Result:**
   - ✅ Redirected to `/questions`
   - ✅ Can add questions
   - ✅ Login works!

---

## 🆘 If Still Not Working

### Check 1: User exists in both tables

```sql
SELECT 
  au.id,
  au.email,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email = 'your-email@example.com';
```

**Should show:**
- id: (some UUID)
- email: your-email@example.com
- role: admin

**If role is NULL**, run:
```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Check 2: RLS policy exists

```sql
SELECT policyname
FROM pg_policies
WHERE tablename = 'users'
AND policyname = 'Users can read own record';
```

**Should return:** `Users can read own record`

**If empty**, run:
```sql
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### Check 3: Browser console errors

Open Console (F12) and look for:
- ❌ "Sign in error" → Wrong password
- ❌ "User not found in users table" → Run SQL above
- ❌ "Failed to verify user role" → Add RLS policy
- ❌ "Access denied" → Update role to admin

---

## 📚 More Help

- **Detailed debugging**: See `LOGIN_DEBUG.md`
- **Setup guide**: See `START_HERE.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`

---

**Files Updated:**
- ✅ `lib/supabase.ts` - Fixed client configuration
- ✅ `app/login/page.tsx` - Improved error handling
- ✅ `LOGIN_DEBUG.md` - Created debug guide
- ✅ `LOGIN_FIX_SUMMARY.md` - This file

**Status:** ✅ Login should now work!
