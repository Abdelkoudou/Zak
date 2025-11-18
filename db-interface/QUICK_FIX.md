# 🔧 Quick Fix - RLS Permission Error

## ❌ The Error You're Seeing

```
❌ new row violates row-level security policy for table "questions"
POST https://xxx.supabase.co/rest/v1/questions 401 (Unauthorized)
Code: 42501
```

## ✅ The Solution (30 seconds)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL

Copy and paste this into the SQL Editor:

```sql
-- Disable RLS for admin interface
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Enabled' 
    ELSE '✅ RLS Disabled' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('questions', 'answers', 'course_resources');
```

### Step 3: Click "Run"

You should see:
```
✅ questions - RLS Disabled
✅ answers - RLS Disabled
✅ course_resources - RLS Disabled
```

### Step 4: Try Adding a Question Again

Go back to http://localhost:3001/questions and try adding a question. It should work now! 🎉

---

## 🔍 What Was Wrong?

**Row Level Security (RLS)** policies were blocking your admin interface from inserting questions because:

1. The admin interface uses the `anon` key (not authenticated)
2. RLS policies require authentication + proper role (manager/admin/owner)
3. For an admin interface, we don't need RLS - it's internal only

## 🛡️ Is This Safe?

**For Development/Admin Interface**: ✅ YES
- This is an internal admin tool
- Not exposed to public users
- Only you have access to localhost:3001

**For Production Mobile App**: ❌ NO
- Keep RLS enabled for user-facing tables
- Users table, saved_questions, test_attempts should stay protected

## 📝 Alternative: Use Service Role Key

If you prefer to keep RLS enabled, you can use the service role key instead:

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (keep it secret!)
3. Update `db-interface/lib/supabase.ts`:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role

export const supabase = createClient(supabaseUrl, supabaseKey);
```

4. Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Warning**: Never expose service role key in client-side code!

---

## 🆘 Still Having Issues?

### Issue: "relation does not exist"
**Fix**: Run `schema.sql` first to create tables

### Issue: "No modules found"
**Fix**: Run `seed.sql` to insert modules

### Issue: Still getting 401
**Fix**: 
1. Check `.env.local` has correct Supabase URL and anon key
2. Restart dev server: `npm run dev`
3. Clear browser cache

---

**Total Time**: 30 seconds  
**Result**: Working admin interface! 🎉
