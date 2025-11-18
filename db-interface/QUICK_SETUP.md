# Quick Setup - DB Interface with Supabase

## ⚡ 5-Minute Setup

### 1. Create Supabase Project (2 min)
```
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details and create
4. Wait for project to be ready
```

### 2. Run SQL Files (1 min)
In Supabase dashboard → SQL Editor:
```sql
-- Run these in order:
1. Copy/paste supabase/schema.sql → Run
2. Copy/paste supabase/seed.sql → Run
3. Copy/paste supabase/rls-policies.sql → Run
```

### 3. Get Credentials (30 sec)
```
Settings → API
- Copy "Project URL"
- Copy "anon public" key
```

### 4. Configure App (1 min)
Edit `db-interface/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Restart Server (30 sec)
```bash
# Stop server (Ctrl+C)
npm run dev
```

## ✅ Test It Works

1. Go to http://localhost:3001/questions
2. Yellow warning should be gone
3. Click "➕ Nouvelle Question"
4. Fill form and submit
5. See "✅ Question ajoutée avec succès!"

## 🎯 That's It!

You're now connected to Supabase and can:
- ✅ Add questions to database
- ✅ View all questions
- ✅ Delete questions
- ✅ See real-time statistics

## 📚 Need More Help?

- **Detailed Guide**: `SUPABASE_SETUP.md`
- **Supabase Docs**: https://supabase.com/docs
- **SQL Files**: `supabase/` folder

## 🔧 Troubleshooting

**Yellow warning still showing?**
- Check `.env.local` has real values (not "placeholder")
- Restart dev server
- Check browser console for errors

**"Permission denied" error?**
- Re-run `rls-policies.sql` in Supabase
- Or temporarily disable RLS for testing

**"Module not found" error?**
- Run `seed.sql` again
- Check: `SELECT COUNT(*) FROM modules;` should return 17

---

**Quick Start**: 5 minutes
**Full Setup**: 10 minutes
**Result**: Production-ready admin interface! 🎉
