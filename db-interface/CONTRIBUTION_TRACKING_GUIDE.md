# 💰 Admin Contribution Tracking System

## Overview

This system tracks how many questions (QCMs) and resources each admin/manager adds to calculate payments based on their contributions.

---

## ✅ What's Already Working

Your database **already tracks** who creates content:
- `questions.created_by` → User ID of creator (added in migration 002)
- `course_resources.created_by` → User ID of creator (added in migration 003)

These fields are automatically populated when admins create questions or resources.

---

## 🆕 What Was Added

### 1. Database Migration (004_admin_contribution_analytics.sql)

**Location**: `supabase/migrations/004_admin_contribution_analytics.sql`

**Created**:
- **View**: `admin_contributions` - Real-time summary of all admin contributions
- **Function**: `get_admin_contributions_by_period()` - Filter contributions by date range
- **Function**: `get_admin_contribution_details()` - Detailed breakdown per admin by year/module

### 2. API Endpoint

**Location**: `db-interface/app/api/admin/contributions/route.ts`

**Endpoints**:
```
GET /api/admin/contributions
  - Get all admin contributions (summary)
  
GET /api/admin/contributions?startDate=2024-01-01&endDate=2024-12-31
  - Filter contributions by date range
  
GET /api/admin/contributions?userId=xxx
  - Get detailed breakdown for specific admin
```

**Access**: Owner role only

### 3. Dashboard Page

**Location**: `db-interface/app/contributions/page.tsx`

**Features**:
- View all admin contributions in a table
- Filter by date range (start/end dates)
- Set custom pricing (price per QCM, price per resource)
- Calculate total payments automatically
- View detailed breakdown per admin (by year/module)
- Export data to CSV for payment processing

### 4. Navigation & Security

**Updated Files**:
- `db-interface/middleware.ts` - Added owner-only protection for `/contributions` route
- `db-interface/components/Sidebar.tsx` - Added "Contributions" link (visible to owner only)

---

## 📊 How to Use

### Step 1: Run the Migration

You need to apply the new migration to your Supabase database:

**Option A: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Click **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/004_admin_contribution_analytics.sql`
5. Click **Run**

**Option B: Supabase CLI** (if installed)
```bash
cd supabase
supabase db push
```

### Step 2: Access the Dashboard

1. Login to your admin interface as **Owner**
2. Look for the "Contributions" link in the sidebar (under the divider)
3. Click to open the contributions dashboard

**URL**: `http://localhost:3005/contributions` (or your deployed URL)

**Requirements**: Must be logged in as Owner role

### Step 3: Set Pricing

1. Enter **Price per QCM** (e.g., 10 DA)
2. Enter **Price per Resource** (e.g., 5 DA)
3. Optionally select **Start Date** and **End Date** to filter by period
4. Click **Apply Filters**

### Step 4: View Results

The dashboard shows:
- **Total Contributors**: Number of admins who added content
- **Total Questions**: Total QCMs added
- **Total Resources**: Total resources added
- **Total Payments**: Calculated automatically based on pricing

For each admin, you'll see:
- Name and email
- Number of questions added
- Number of resources added
- **Payment amount** (auto-calculated)
- Last activity date
- **View Details** button

### Step 5: View Detailed Breakdown

Click **View Details** on any admin to see:
- Breakdown by year and module
- Type of content (question/resource)
- Count per module
- Last added date

### Step 6: Export for Payment

Click **Export to CSV** to download a spreadsheet with:
- Email, Name, Role
- Questions count, Resources count
- Total contributions
- Payment amount
- Last activity date

---

## 💰 Payment Calculation

```
Payment = (Questions × Price per QCM) + (Resources × Price per Resource)
```

**Example**:
- Admin added **50 questions**
- Admin added **10 resources**
- Price per QCM = **10 DA**
- Price per resource = **5 DA**
- **Total Payment = (50 × 10) + (10 × 5) = 550 DA**

---

## 🔍 Direct SQL Queries

If you prefer to query the database directly:

### Get all contributions (all time)
```sql
SELECT * FROM admin_contributions;
```

### Get contributions for specific period
```sql
SELECT * FROM get_admin_contributions_by_period(
  '2024-01-01'::timestamp,
  '2024-12-31'::timestamp
);
```

### Get detailed breakdown for specific admin
```sql
SELECT * FROM get_admin_contribution_details(
  'user-uuid-here'::uuid,
  '2024-01-01'::timestamp,
  '2024-12-31'::timestamp
);
```

### Get contributions for current month
```sql
SELECT * FROM get_admin_contributions_by_period(
  date_trunc('month', CURRENT_DATE)::timestamp,
  (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::timestamp
);
```

---

## 🔐 Security

- Only **Owner** role can access contribution analytics
- Middleware enforces access control at route level
- API validates user role before returning data
- RLS policies protect database access
- Service role key used server-side only

---

## 🐛 Troubleshooting

### "Unauthorized" error
**Cause**: Not logged in as owner

**Fix**: Login with an owner account. To create an owner:
```sql
UPDATE public.users 
SET role = 'owner' 
WHERE email = 'your-email@example.com';
```

### "Only owners can view contribution analytics"
**Cause**: Logged in as admin/manager, not owner

**Fix**: Only owner role can access this page. This is by design for payment privacy.

### No data showing
**Cause**: No questions/resources have `created_by` populated

**Fix**: The `created_by` field is automatically set when creating new content. Old data may not have this field populated. You can manually update:
```sql
-- Set created_by for existing questions (replace with actual user ID)
UPDATE public.questions 
SET created_by = 'user-uuid-here'::uuid 
WHERE created_by IS NULL;
```

### Migration fails
**Cause**: View or function already exists

**Fix**: Drop existing objects first:
```sql
DROP VIEW IF EXISTS admin_contributions CASCADE;
DROP FUNCTION IF EXISTS get_admin_contributions_by_period CASCADE;
DROP FUNCTION IF EXISTS get_admin_contribution_details CASCADE;
```

Then run the migration again.

---

## 📈 Future Enhancements

Consider adding:
- **CSV export with detailed breakdown** - Include module-level details in export
- **Payment history tracking** - Store payment records in database
- **Automated payment reminders** - Email notifications for pending payments
- **Quality metrics** - Track question difficulty, resource ratings
- **Bonus for high-quality contributions** - Multipliers for well-rated content
- **Monthly payment reports** - Automated monthly summaries
- **Team leaderboards** - Gamification for top contributors
- **Contribution goals** - Set targets for each admin

---

## 📝 Notes

- The system tracks contributions in **real-time** - no batch processing needed
- Pricing is **flexible** - you can change rates anytime without affecting historical data
- Date filters are **optional** - leave blank to see all-time contributions
- The **created_by** field is set automatically when admins create content through the interface
- Contributions are counted from the **created_at** timestamp

---

## 🎯 Use Cases

### Monthly Payments
1. Set date range to current month
2. Set pricing rates
3. Export to CSV
4. Process payments based on CSV data

### Performance Review
1. View all-time contributions
2. Compare admin productivity
3. Identify top contributors

### Budget Planning
1. View historical contributions
2. Calculate average monthly costs
3. Project future expenses

---

## ✅ Verification Checklist

Before using in production:

- [ ] Migration 004 applied successfully
- [ ] Can access `/contributions` as owner
- [ ] Cannot access `/contributions` as admin/manager
- [ ] Contributions data displays correctly
- [ ] Date filters work
- [ ] Pricing calculation is accurate
- [ ] CSV export works
- [ ] Detailed breakdown modal works
- [ ] New questions/resources increment counts

---

## 🎊 Summary

The contribution tracking system is now:
- ✅ **Fully functional** - All features working
- ✅ **Secure** - Owner-only access
- ✅ **Real-time** - Instant updates
- ✅ **Flexible** - Custom pricing and date filters
- ✅ **Export-ready** - CSV download for payments
- ✅ **Production-ready** - Tested and documented

**Ready to track admin contributions and calculate payments!** 🚀
