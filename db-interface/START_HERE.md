# 🚀 START HERE - Admin Interface Setup

Welcome! This guide will get your admin interface ready to host in 5 minutes.

---

## 🎯 What You're Building

A **secure web interface** where admins can:
- ✅ Login with email/password
- ✅ Add/edit/delete questions
- ✅ Manage course resources
- ✅ Access from anywhere (not just localhost)

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Package (30 seconds)

```bash
cd db-interface
npm install
```

The `@supabase/ssr` package is already in package.json and will be installed automatically.

### Step 2: Get Service Role Key (1 minute)

1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/settings/api
2. Scroll to **Project API keys**
3. Copy the **service_role** key (the long one)
4. Open `.env.local` and add:

```env
SUPABASE_SERVICE_ROLE_KEY=paste-your-key-here
```

⚠️ **Important**: This key is secret! Never commit it to git.

### Step 3: Create Admin User (2 minutes)

1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/editor
2. Click **SQL Editor**
3. Click **New Query**
4. Copy and paste this (change email and password):

```sql
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, recovery_sent_at, last_sign_in_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',  -- ⚠️ CHANGE THIS
    crypt('admin123', gen_salt('bf')),  -- ⚠️ CHANGE THIS PASSWORD!
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(), NOW(), NOW(), NOW(),
    '', '', '', ''
  ) RETURNING id INTO new_user_id;

  -- Set admin role
  INSERT INTO public.users (id, email, role)
  VALUES (new_user_id, 'admin@example.com', 'admin');  -- ⚠️ CHANGE EMAIL
  
  RAISE NOTICE 'Admin user created successfully!';
END $$;
```

5. Click **Run**
6. You should see: "Admin user created successfully!"

### Step 4: Test Locally (1 minute)

```bash
npm run dev
```

1. Open: http://localhost:3001/login
2. Login with your admin credentials
3. Try adding a question
4. ✅ Success!

---

## 🚀 Deploy to Production (10 Minutes)

Once local testing works, follow: **`DEPLOYMENT_GUIDE.md`**

Quick steps:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

---

## 🆘 Troubleshooting

### "Module not found: @supabase/ssr"
```bash
npm install @supabase/ssr
```

### "Unauthorized" when adding questions
Check `.env.local` has the service role key:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Restart dev server after adding it:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Can't login
Verify admin user exists:
```sql
SELECT u.email, pu.role
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
WHERE u.email = 'admin@example.com';
```

Should show: `admin@example.com | admin`

### "Forbidden" error
User doesn't have admin role:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

---

## 📚 Full Documentation

| File | Purpose |
|------|---------|
| **START_HERE.md** | This file - quick start |
| `SECURE_SETUP.md` | Detailed setup guide |
| `DEPLOYMENT_GUIDE.md` | Deploy to Vercel |
| `HOSTING_SOLUTION.md` | Architecture overview |
| `README.md` | Project overview |

---

## ✅ Checklist

Setup complete when:
- [ ] `@supabase/ssr` installed
- [ ] Service role key in `.env.local`
- [ ] Admin user created
- [ ] Can login at http://localhost:3001/login
- [ ] Can add questions successfully
- [ ] No errors in console

---

## 🎉 Ready to Deploy?

1. ✅ Test locally first
2. ✅ Read `DEPLOYMENT_GUIDE.md`
3. ✅ Deploy to Vercel
4. ✅ Share with admin team!

---

**Questions?** Check the other documentation files or the troubleshooting section above.

**Good luck! 🚀**
