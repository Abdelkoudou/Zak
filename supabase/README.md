# Supabase Backend - MCQ Study App

## 📁 Files Overview

| File | Description | Purpose |
|------|-------------|---------|
| `schema.sql` | Database schema | Creates all tables, indexes, triggers, and functions |
| `seed.sql` | Initial data | Inserts 17 predefined modules |
| `rls-policies.sql` | Security policies | Row Level Security for data protection |
| `types.ts` | TypeScript types | Type definitions for frontend |
| `SETUP_GUIDE.md` | Setup instructions | Step-by-step setup guide |
| `README.md` | This file | Overview and quick reference |

## 🚀 Quick Start

### 1. Create Supabase Project
```
1. Go to https://supabase.com
2. Create new project
3. Wait for project to be ready
```

### 2. Run SQL Files (in order)
```sql
-- 1. Create schema
Run: schema.sql

-- 2. Insert modules
Run: seed.sql

-- 3. Apply security
Run: rls-policies.sql
```

### 3. Get Credentials
```
Settings → API
- Copy Project URL
- Copy anon public key
```

### 4. Configure Mobile App
```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Database Structure

### Tables (9 total)

1. **users** - User accounts and profiles
2. **modules** - 17 predefined modules (read-only)
3. **questions** - MCQ questions
4. **answers** - Answer options (A-E)
5. **course_resources** - Course materials
6. **activation_keys** - Subscription keys
7. **device_sessions** - Device tracking (max 2)
8. **saved_questions** - User bookmarks
9. **test_attempts** - Practice results

### Key Features

- ✅ **17 Predefined Modules** - French medical curriculum
- ✅ **Row Level Security** - Data protection by role
- ✅ **Auto-timestamps** - Automatic created_at/updated_at
- ✅ **Foreign Keys** - Referential integrity
- ✅ **Indexes** - Optimized queries
- ✅ **Triggers** - Business logic enforcement
- ✅ **Functions** - Subscription activation, etc.

## 🔐 Security Model

### User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to everything |
| **Admin** | Manage users, keys, view all data |
| **Manager** | Create/edit questions and resources |
| **Student** | View questions (if paid), save, practice |

### RLS Policies

- Users can only see their own data
- Paid users can access questions
- Managers can create content
- Admins can manage users
- Owner can do everything

## 📝 Common Operations

### Add Question
```sql
INSERT INTO questions (year, module_name, exam_type, number, question_text)
VALUES ('1', 'Anatomie', 'EMD1', 1, 'Question text here');
```

### Add Answers
```sql
INSERT INTO answers (question_id, option_label, answer_text, is_correct, display_order)
VALUES 
  ('question-uuid', 'A', 'Answer A', true, 1),
  ('question-uuid', 'B', 'Answer B', false, 2);
```

### Generate Key
```sql
INSERT INTO activation_keys (key_code, duration_days)
VALUES ('MCQ-ABCD1234', 365);
```

### Activate Subscription
```sql
SELECT activate_subscription('user-uuid', 'MCQ-ABCD1234');
```

## 📈 Monitoring

### Check Module Count
```sql
SELECT COUNT(*) FROM modules; -- Should be 17
```

### Check RLS Status
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

### View User Stats
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_paid) as paid_users
FROM users;
```

## 💰 Cost Estimate

### Free Tier (Up to 50K users)
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month
- **Cost: $0/month**

### Pro Tier (50K-100K users)
- Database: 8 GB
- Storage: 100 GB
- Bandwidth: 50 GB/month
- **Cost: $25/month**

## 🔧 Troubleshooting

### Issue: Tables not created
**Solution**: Run `schema.sql` again

### Issue: Modules not inserted
**Solution**: Run `seed.sql` again

### Issue: Permission denied
**Solution**: Run `rls-policies.sql` again

### Issue: Function not found
**Solution**: Re-run `schema.sql` to create functions

## 📚 Documentation

- **SETUP_GUIDE.md** - Detailed setup instructions
- **schema.sql** - Full schema with comments
- **types.ts** - TypeScript type definitions
- **Supabase Docs** - https://supabase.com/docs

## ✅ Verification Checklist

After setup, verify:

- [ ] 17 modules inserted
- [ ] RLS enabled on all tables
- [ ] Policies created
- [ ] Owner account created
- [ ] API credentials copied
- [ ] Mobile app configured
- [ ] Test authentication works
- [ ] Test question creation works

## 🎯 Next Steps

1. ✅ Complete Supabase setup
2. ✅ Configure mobile app with credentials
3. ✅ Test authentication flow
4. ✅ Add sample questions for testing
5. ✅ Test question browsing
6. ✅ Test subscription activation
7. ✅ Deploy mobile app

## 📞 Support

For issues or questions:
- Check SETUP_GUIDE.md for detailed instructions
- Review Supabase documentation
- Check SQL comments in schema files
- Test queries in SQL Editor

---

**Status**: ✅ Production Ready
**Version**: 1.0
**Last Updated**: November 2025
