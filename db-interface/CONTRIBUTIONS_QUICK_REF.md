# 💰 Contributions - Quick Reference

## 🚀 Setup (One-time)

1. **Apply Migration**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `supabase/migrations/004_admin_contribution_analytics.sql`

2. **Verify**
   ```sql
   SELECT * FROM admin_contributions;
   ```

3. **Access**
   - URL: `/contributions`
   - Role: Owner only

---

## 📊 Daily Use

### View Contributions
1. Login as Owner
2. Click "Contributions" in sidebar
3. View summary statistics

### Calculate Payments
1. Set price per QCM (e.g., 10 DA)
2. Set price per resource (e.g., 5 DA)
3. Optionally set date range
4. Click "Apply Filters"
5. View calculated payments

### Export for Payment
1. Click "Export to CSV"
2. Open in Excel/Google Sheets
3. Process payments

### View Details
1. Click "View Details" on any admin
2. See breakdown by year/module
3. Close modal when done

---

## 💡 Quick Tips

- **No date range** = All-time contributions
- **Pricing changes** = Instant recalculation
- **CSV export** = Includes all data
- **Real-time** = Updates automatically

---

## 🔍 SQL Queries

### All contributions
```sql
SELECT * FROM admin_contributions;
```

### This month
```sql
SELECT * FROM get_admin_contributions_by_period(
  date_trunc('month', CURRENT_DATE),
  date_trunc('month', CURRENT_DATE) + interval '1 month'
);
```

### Specific admin
```sql
SELECT * FROM get_admin_contribution_details('user-uuid-here');
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Can't access page | Must be owner role |
| No data showing | No contributions yet |
| Function error | Migration not applied |
| Wrong calculations | Check pricing inputs |

---

## 📞 Help

- Full guide: `CONTRIBUTION_TRACKING_GUIDE.md`
- Setup: `SETUP_CONTRIBUTIONS.md`
- Summary: `CONTRIBUTION_TRACKING_COMPLETE.md`
