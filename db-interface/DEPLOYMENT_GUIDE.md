# 🚀 Deployment Guide - Secure Admin Interface

This guide shows you how to deploy the admin interface so multiple admins can access it securely.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Users                          │
│              (Browser - anywhere)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Vercel/Netlify (Hosting)                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Next.js App (db-interface)                    │    │
│  │                                                 │    │
│  │  ┌──────────────┐      ┌──────────────────┐   │    │
│  │  │ Login Page   │      │  API Routes      │   │    │
│  │  │ (Client)     │      │  (Server-side)   │   │    │
│  │  │              │      │                  │   │    │
│  │  │ Uses:        │      │  Uses:           │   │    │
│  │  │ - anon key   │      │  - service key   │   │    │
│  │  │ - Auth       │      │  - Bypasses RLS  │   │    │
│  │  └──────────────┘      └──────────────────┘   │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │ Authenticated Requests
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase                               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth         │  │ Database     │  │ Storage      │ │
│  │ (JWT)        │  │ (PostgreSQL) │  │ (Files)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Security Features:**
- ✅ Authentication required (Supabase Auth)
- ✅ Role-based access (admin/manager/owner only)
- ✅ RLS enabled (protects against direct access)
- ✅ Service key server-side only (never exposed)
- ✅ HTTPS encryption
- ✅ Session management

---

## 📋 Prerequisites

1. **Supabase Project** (already set up)
2. **Vercel Account** (free) - https://vercel.com
3. **Admin User** created in Supabase

---

## 🔧 Step 1: Install Dependencies

```bash
cd db-interface
npm install @supabase/auth-helpers-nextjs
```

---

## 🔑 Step 2: Get Service Role Key

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (⚠️ Keep this secret!)
5. Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Never commit this key to git!

---

## 👤 Step 3: Create Admin Users

### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - Email: `admin@example.com`
   - Password: (strong password)
   - Auto Confirm User: ✅ Yes
4. Click **Create User**
5. Copy the user's UUID

6. Go to **SQL Editor** and run:
```sql
-- Replace USER_UUID with the actual UUID
UPDATE public.users
SET role = 'admin'
WHERE id = 'USER_UUID';
```

### Option B: Using SQL Script

```sql
-- Create admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('your-password-here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Get the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Set role to admin
INSERT INTO public.users (id, email, role)
VALUES ('USER_ID_FROM_ABOVE', 'admin@example.com', 'admin');
```

---

## 🚀 Step 4: Deploy to Vercel

### 4.1 Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Admin interface with authentication"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/mcq-admin.git
git push -u origin main
```

### 4.2 Deploy on Vercel

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `db-interface`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tkthvgvjecihqfnknosj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (⚠️ SECRET!)
   ```

6. Click **Deploy**

### 4.3 Wait for Deployment

- Build time: ~2-3 minutes
- You'll get a URL like: `https://mcq-admin.vercel.app`

---

## ✅ Step 5: Test the Deployment

1. Visit your Vercel URL: `https://mcq-admin.vercel.app`
2. You should see the login page
3. Login with admin credentials
4. Try adding a question
5. ✅ Success!

---

## 🔒 Security Checklist

### ✅ Before Going Live

- [ ] Service role key added to Vercel (not in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] Admin users created with strong passwords
- [ ] RLS policies enabled on all tables
- [ ] Middleware protecting admin routes
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Test authentication flow
- [ ] Test role-based access

### ✅ After Deployment

- [ ] Change default admin password
- [ ] Enable 2FA for admin accounts (optional)
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Supabase usage
- [ ] Set up alerts for suspicious activity

---

## 🌐 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your domain: `admin.yourdomain.com`
4. Update DNS records (Vercel provides instructions)
5. Wait for SSL certificate (automatic)

---

## 👥 Managing Admin Users

### Add New Admin

```sql
-- 1. Create user in Supabase Auth (via Dashboard)
-- 2. Then run this SQL:
UPDATE public.users
SET role = 'admin'
WHERE email = 'newadmin@example.com';
```

### Remove Admin Access

```sql
UPDATE public.users
SET role = 'student'
WHERE email = 'oldadmin@example.com';
```

### List All Admins

```sql
SELECT id, email, role, created_at
FROM public.users
WHERE role IN ('owner', 'admin', 'manager')
ORDER BY created_at DESC;
```

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" when adding questions

**Fix**: Check service role key is set in Vercel environment variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `SUPABASE_SERVICE_ROLE_KEY` exists
3. Redeploy if you just added it

### Issue: "Forbidden - Role 'student' cannot create questions"

**Fix**: User doesn't have admin role

```sql
-- Check user role
SELECT email, role FROM public.users WHERE email = 'user@example.com';

-- Update to admin
UPDATE public.users SET role = 'admin' WHERE email = 'user@example.com';
```

### Issue: Redirected to login after signing in

**Fix**: Middleware can't read users table

1. Check RLS policies allow reading users table
2. Run this SQL:

```sql
-- Allow authenticated users to read their own user record
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
```

### Issue: Build fails on Vercel

**Fix**: Missing dependencies

```bash
# Make sure these are in package.json
npm install @supabase/ssr
npm install @supabase/supabase-js
```

---

## 📊 Monitoring

### Vercel Analytics

- Go to Vercel Dashboard → Analytics
- Monitor:
  - Page views
  - Response times
  - Error rates

### Supabase Logs

- Go to Supabase Dashboard → Logs
- Monitor:
  - API requests
  - Authentication attempts
  - Database queries

---

## 💰 Cost Estimate

### Free Tier (Recommended for Start)

```
Vercel:
- Hosting: FREE
- Bandwidth: 100GB/month
- Builds: Unlimited

Supabase:
- Database: FREE (up to 500MB)
- Auth: FREE (up to 50,000 users)
- Storage: FREE (up to 1GB)

Total: $0/month
```

### When to Upgrade

**Vercel Pro ($20/month):**
- Need more bandwidth (>100GB)
- Need team collaboration
- Need advanced analytics

**Supabase Pro ($25/month):**
- Database >500MB
- Need daily backups
- Need point-in-time recovery

---

## 🎉 You're Done!

Your admin interface is now:
- ✅ Deployed and accessible online
- ✅ Secured with authentication
- ✅ Protected with role-based access
- ✅ Using HTTPS encryption
- ✅ Ready for multiple admins

**Admin URL**: `https://your-project.vercel.app`

Share this URL with your admin team and provide them with login credentials!

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
