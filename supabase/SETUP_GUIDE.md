# Supabase Setup Guide - MCQ Study App

## Overview

This guide will walk you through setting up the Supabase backend for the MCQ Study App.

## Prerequisites

- Supabase account (free tier is sufficient to start)
- Basic understanding of SQL
- Access to Supabase dashboard

## Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: mcq-study-app (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose closest to Algeria (Europe West recommended)
   - **Pricing Plan**: Free (sufficient for up to 50,000 users)
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

### Step 2: Run Schema SQL

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content of `schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. Wait for execution to complete
7. You should see: "Success. No rows returned"

**What this does:**
- Creates all database tables
- Sets up ENUM types
- Creates indexes for performance
- Adds triggers for auto-timestamps
- Creates helper functions

### Step 3: Run Seed Data

1. In SQL Editor, click "New Query"
2. Copy the entire content of `seed.sql`
3. Paste it into the SQL editor
4. Click "Run"
5. You should see: "✅ Successfully inserted all 17 predefined modules"

**What this does:**
- Inserts all 17 predefined modules
- 10 modules for 1st year
- 7 modules for 2nd year
- Verifies insertion was successful

### Step 4: Apply RLS Policies

1. In SQL Editor, click "New Query"
2. Copy the entire content of `rls-policies.sql`
3. Paste it into the SQL editor
4. Click "Run"
5. You should see: "✅ RLS policies created successfully"

**What this does:**
- Enables Row Level Security on all tables
- Creates access control policies
- Sets up role-based permissions
- Protects user data

### Step 5: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable Email Confirmations**: Yes (recommended)
   - **Enable Email Change Confirmations**: Yes
   - **Secure Email Change**: Yes
4. Optionally configure SMTP for custom emails

### Step 6: Create Owner Account

1. Go to **Authentication** → **Users**
2. Click "Add User"
3. Fill in:
   - **Email**: your-admin-email@example.com
   - **Password**: Choose a strong password
   - **Auto Confirm User**: Yes
4. Click "Create User"
5. Copy the user's UUID

6. Go to **SQL Editor** and run:
```sql
-- Replace 'USER_UUID_HERE' with the actual UUID
UPDATE public.users
SET role = 'owner'
WHERE id = 'USER_UUID_HERE';
```

### Step 7: Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them for the mobile app):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

3. Save these in your mobile app's `.env` file:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 8: Verify Setup

Run these verification queries in SQL Editor:

```sql
-- Check modules (should return 17)
SELECT COUNT(*) as total_modules FROM public.modules;

-- Check module distribution
SELECT year, type, COUNT(*) as count
FROM public.modules
GROUP BY year, type
ORDER BY year, type;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected results:
- ✅ 17 modules total
- ✅ 10 modules for year 1
- ✅ 7 modules for year 2
- ✅ RLS enabled on all tables
- ✅ Multiple policies per table

## Database Structure

### Tables Created

1. **users** - User accounts and profiles
2. **modules** - 17 predefined modules (read-only)
3. **questions** - MCQ questions
4. **answers** - Answer options (A-E)
5. **course_resources** - Course materials links
6. **activation_keys** - Subscription keys
7. **device_sessions** - Device tracking (max 2)
8. **saved_questions** - User bookmarks
9. **test_attempts** - Practice results

### Key Features

- ✅ **Row Level Security**: Data is protected by user role
- ✅ **Auto-timestamps**: created_at and updated_at auto-managed
- ✅ **Referential Integrity**: Foreign keys ensure data consistency
- ✅ **Performance**: Indexes on frequently queried columns
- ✅ **Constraints**: Unique constraints prevent duplicates

## Common Operations

### Add a Question

```sql
-- Insert question
INSERT INTO public.questions (
  year, module_name, exam_type, number, question_text, explanation
) VALUES (
  '1', 'Anatomie', 'EMD1', 1,
  'Quelle est la fonction principale du cœur?',
  'Le cœur est une pompe musculaire qui propulse le sang.'
);

-- Insert answers
INSERT INTO public.answers (question_id, option_label, answer_text, is_correct, display_order)
SELECT 
  (SELECT id FROM public.questions WHERE module_name = 'Anatomie' AND number = 1),
  unnest(ARRAY['A', 'B', 'C', 'D', 'E']),
  unnest(ARRAY[
    'Pomper le sang dans tout le corps',
    'Filtrer le sang',
    'Produire des globules rouges',
    'Stocker l''oxygène',
    'Réguler la température'
  ]),
  unnest(ARRAY[TRUE, FALSE, FALSE, FALSE, FALSE]),
  unnest(ARRAY[1, 2, 3, 4, 5]);
```

### Generate Activation Key

```sql
INSERT INTO public.activation_keys (key_code, duration_days, created_by)
VALUES (
  'MCQ-' || upper(substring(md5(random()::text) from 1 for 8)),
  365,
  (SELECT id FROM public.users WHERE role = 'owner' LIMIT 1)
);
```

### Activate Subscription

```sql
SELECT activate_subscription(
  'USER_UUID_HERE',
  'MCQ-ABCD1234'
);
```

### View User Statistics

```sql
SELECT 
  u.email,
  u.role,
  u.is_paid,
  u.subscription_expires_at,
  COUNT(DISTINCT sq.id) as saved_questions,
  COUNT(DISTINCT ta.id) as test_attempts,
  COUNT(DISTINCT ds.id) as active_devices
FROM public.users u
LEFT JOIN public.saved_questions sq ON sq.user_id = u.id
LEFT JOIN public.test_attempts ta ON ta.user_id = u.id
LEFT JOIN public.device_sessions ds ON ds.user_id = u.id
WHERE u.id = 'USER_UUID_HERE'
GROUP BY u.id, u.email, u.role, u.is_paid, u.subscription_expires_at;
```

## Security Best Practices

### 1. Never Expose service_role Key
- Only use in server-side code
- Never commit to git
- Never send to mobile app

### 2. Use anon Key in Mobile App
- Safe to expose publicly
- RLS policies protect data
- Limited permissions

### 3. Validate on Server
- Don't trust client input
- Use database constraints
- Implement business logic in functions

### 4. Monitor Usage
- Check Supabase dashboard regularly
- Set up usage alerts
- Monitor for suspicious activity

## Troubleshooting

### Issue: "permission denied for table"
**Solution**: Check RLS policies are applied correctly
```sql
-- Re-run rls-policies.sql
```

### Issue: "duplicate key value violates unique constraint"
**Solution**: Check for existing data before inserting
```sql
-- Use ON CONFLICT clause
INSERT INTO ... ON CONFLICT (unique_column) DO NOTHING;
```

### Issue: "function does not exist"
**Solution**: Re-run schema.sql to create functions
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'activate_subscription';
```

### Issue: "relation does not exist"
**Solution**: Tables not created, run schema.sql
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

## Next Steps

1. ✅ **Test the Setup**: Try creating a question via SQL
2. ✅ **Configure Mobile App**: Add Supabase credentials to .env
3. ✅ **Test Authentication**: Try signing up/in from mobile app
4. ✅ **Add Sample Data**: Create test questions for development
5. ✅ **Monitor Performance**: Check query performance in dashboard

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **SQL Reference**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Project Dashboard**: Your Supabase project URL

## Cost Monitoring

### Free Tier Limits
- **Database**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 2 GB
- **Monthly Active Users**: 50,000

### When to Upgrade
- Approaching 500 MB database size
- Need more than 2 GB bandwidth/month
- Require custom domain
- Need point-in-time recovery

### Pro Tier ($25/month)
- **Database**: 8 GB
- **Storage**: 100 GB
- **Bandwidth**: 50 GB
- **Daily backups**
- **Email support**

---

**Setup Complete!** 🎉

Your Supabase backend is now ready for the MCQ Study App.
