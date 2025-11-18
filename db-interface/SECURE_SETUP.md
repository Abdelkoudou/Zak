# 🔐 Secure Setup - Production Ready

This guide sets up the admin interface with proper authentication for hosting.

---

## 🎯 What We're Building

**Before (Insecure):**
- ❌ No authentication
- ❌ RLS disabled
- ❌ Anyone can add questions
- ❌ Only works on localhost

**After (Secure):**
- ✅ Authentication required
- ✅ RLS enabled
- ✅ Only admins can add questions
- ✅ Can be hosted publicly

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd db-interface
npm install @supabase/ssr
```

### Step 2: Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj
2. Click **Settings** → **API**
3. Copy the **service_role** key
4. Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
```

### Step 3: Create Admin User

Go to **SQL Editor** and run:

```sql
-- Create admin user (replace email and password)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com', -- Change this
    crypt('admin123', gen_salt('bf')), -- Change this password!
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Insert into public.users with admin role
  INSERT INTO public.users (id, email, role)
  VALUES (new_user_id, 'admin@example.com', 'admin');
  
  RAISE NOTICE 'Admin user created with ID: %', new_user_id;
END $$;
```

### Step 4: Keep RLS Enabled

**DO NOT run** `disable-rls-for-development.sql`

RLS should stay enabled for security. The API routes use the service role key to bypass RLS server-side.

### Step 5: Test Locally

```bash
npm run dev
```

1. Go to: http://localhost:3001/login
2. Login with admin credentials
3. Try adding a question
4. ✅ Should work!

---

## 🚀 Deploy to Production

See `DEPLOYMENT_GUIDE.md` for full deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

---

## 🔒 Security Features

### Authentication
- ✅ Supabase Auth (JWT tokens)
- ✅ Session management
- ✅ Secure password hashing

### Authorization
- ✅ Role-based access control
- ✅ Middleware protects routes
- ✅ API validates user role

### Database Security
- ✅ RLS enabled (protects data)
- ✅ Service key server-side only
- ✅ Policies prevent direct access

### Network Security
- ✅ HTTPS encryption (on Vercel)
- ✅ Secure headers
- ✅ CORS configured

---

## 📁 Files Created

```
db-interface/
├── lib/
│   ├── supabase.ts              # Client-side (anon key)
│   └── supabase-admin.ts        # Server-side (service key) ✨ NEW
├── app/
│   ├── api/
│   │   └── questions/
│   │       └── route.ts         # API endpoint ✨ NEW
│   └── login/
│       └── page.tsx             # Login page ✨ NEW
├── middleware.ts                # Route protection ✨ NEW
└── .env.local                   # Add service key ✨ UPDATED
```

---

## 🔄 How It Works

### 1. User Logs In
```
User → Login Page → Supabase Auth → JWT Token → Stored in Browser
```

### 2. User Adds Question
```
User → Questions Page → API Route → Verify Token → Check Role → 
Use Service Key → Insert to DB → Return Success
```

### 3. Security Layers
```
Layer 1: Middleware (checks authentication)
Layer 2: API Route (checks role)
Layer 3: RLS Policies (protects database)
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Dependencies installed
- [ ] Service role key in `.env.local`
- [ ] Admin user created
- [ ] Can login at `/login`
- [ ] Can add questions
- [ ] RLS still enabled
- [ ] Middleware protecting routes

---

## 🆘 Troubleshooting

### Can't login

**Check:**
1. Admin user exists in `auth.users`
2. User has admin role in `public.users`
3. Email and password correct

```sql
-- Verify user
SELECT u.email, pu.role
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
WHERE u.email = 'admin@example.com';
```

### "Unauthorized" error

**Check:**
1. Service role key in `.env.local`
2. Restart dev server after adding key
3. Token being sent in Authorization header

### "Forbidden" error

**Check:**
1. User role is admin/manager/owner
2. Update role if needed:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

---

## 🎉 Done!

Your admin interface is now secure and ready to host!

**Next Steps:**
1. ✅ Test locally
2. ✅ Deploy to Vercel (see DEPLOYMENT_GUIDE.md)
3. ✅ Share with admin team
4. ✅ Start adding questions!
