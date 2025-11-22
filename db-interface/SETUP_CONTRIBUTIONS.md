# 🚀 Quick Setup - Contribution Tracking

Follow these steps to enable the contribution tracking system.

---

## Step 1: Apply Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Open your Supabase project: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/004_admin_contribution_analytics.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see success messages in the output

### Option B: Supabase CLI

If you have Supabase CLI installed:

```bash
cd supabase
supabase db push
```

---

## Step 2: Verify Migration

Run this query in SQL Editor to verify:

```sql
-- Check if view exists
SELECT * FROM admin_contributions LIMIT 1;

-- Check if functions exist
SELECT * FROM get_admin_contributions_by_period(NULL, NULL);
```

If no errors, you're good to go! ✅

---

## Step 3: Test the Feature

1. Start your dev server:
   ```bash
   cd db-interface
   npm run dev
   ```

2. Login as **Owner** (if you don't have an owner account, see below)

3. Look for **Contributions** link in the sidebar (below the divider)

4. Click it to open the contributions dashboard

5. You should see a table of all admins who have added questions/resources

---

## Creating an Owner Account

If you don't have an owner account yet:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your email):

```sql
-- Update existing user to owner
UPDATE public.users 
SET role = 'owner' 
WHERE email = 'your-email@example.com';

-- Or create a new owner user
-- First create the user in Authentication → Users
-- Then run:
INSERT INTO public.users (id, email, role, is_paid, subscription_expires_at)
SELECT 
  id,
  email,
  'owner',
  true,
  '2099-12-31'::timestamptz
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'owner';
```

---

## Step 4: Test with Sample Data

If you want to test with sample data:

```sql
-- Add some test questions with created_by
INSERT INTO public.questions (
  year, module_name, exam_type, number, question_text, created_by
)
VALUES 
  ('1', 'Anatomie', 'EMD', 1, 'Test question 1', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
  ('1', 'Anatomie', 'EMD', 2, 'Test question 2', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
  ('2', 'Génétique', 'EMD1', 1, 'Test question 3', (SELECT id FROM public.users WHERE role = 'manager' LIMIT 1));

-- Add some test resources with created_by
INSERT INTO public.course_resources (
  year, module_name, title, type, url, created_by
)
VALUES 
  ('1', 'Anatomie', 'Test Resource 1', 'google_drive', 'https://drive.google.com/test', (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
  ('2', 'Génétique', 'Test Resource 2', 'telegram', 'https://t.me/test', (SELECT id FROM public.users WHERE role = 'manager' LIMIT 1));
```

---

## Troubleshooting

### "Unauthorized" when accessing /contributions

**Solution**: Make sure you're logged in as owner:
```sql
SELECT email, role FROM public.users WHERE email = 'your-email@example.com';
```

### "Function does not exist"

**Solution**: Migration didn't run. Go back to Step 1.

### No data showing in contributions page

**Solution**: No questions/resources have been created yet, or they don't have `created_by` set. Add some test data (see Step 4).

### "Only owners can view contribution analytics"

**Solution**: You're logged in as admin/manager. Only owner role can access this page.

---

## What's Next?

Once setup is complete:

1. ✅ Admins create questions/resources normally
2. ✅ System automatically tracks who created what
3. ✅ Owner can view contributions anytime
4. ✅ Set pricing and calculate payments
5. ✅ Export to CSV for payment processing

---

## Need Help?

Check the full documentation: `CONTRIBUTION_TRACKING_GUIDE.md`
