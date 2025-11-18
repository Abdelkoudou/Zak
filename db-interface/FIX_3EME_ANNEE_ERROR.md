# 🔧 Fix 3ème Année Error

## ❌ The Error

```
Error: insert or update on table "questions" violates foreign key constraint "questions_module_name_fkey"
```

## 🔍 What This Means

The 3ème année modules exist in the code (`predefined-modules.ts`) but **not in the database** yet. The database is checking if the module exists before allowing you to add a question, and it's failing.

## ✅ The Fix (30 seconds)

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/editor

### Step 2: Run This SQL

Click **"New Query"** and paste:

```sql
-- Add 3ème Année U.E.I modules
INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines) VALUES
('Appareil Cardio-vasculaire et respiratoire, Psychologie Médicale et Semiologie Générale', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Neurologique, Locomoteur et Cutané', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Endocrines, Appareil de Reproduction et Appareil Urinaire', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Digestif et Organes Hématopoïétiques', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true)
ON CONFLICT (name, year) DO NOTHING;

-- Add 3ème Année Standalone modules
INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines) VALUES
('Anatomie pathologique', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Immunologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Pharmacologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Microbiologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Parasitologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false)
ON CONFLICT (name, year) DO NOTHING;

-- Verify
SELECT name, year, type FROM public.modules WHERE year = '3'::year_level ORDER BY type, name;
```

### Step 3: Click "Run"

You should see:
```
✅ 9 rows inserted
```

Then the verification query shows all 9 modules for year 3.

### Step 4: Try Adding Question Again

1. Go back to: http://localhost:3001/questions
2. Select **Year: 3**
3. Choose any module
4. Fill in question details
5. Click "Ajouter la Question"
6. ✅ Should work now!

---

## 🔍 Why This Happened

When you add a question, the database checks:
1. Does this module exist in the `modules` table? ✅
2. Does the module name match exactly? ✅
3. Does the year match? ✅

For 2ème année, the modules were already in the database (from `seed.sql`).  
For 3ème année, we just added them to the code but forgot to add them to the database.

Now both are in sync! ✅

---

## 📊 Verify Modules

Check all modules in database:

```sql
SELECT 
  year,
  COUNT(*) as total_modules,
  STRING_AGG(name, ', ' ORDER BY name) as modules
FROM public.modules
GROUP BY year
ORDER BY year;
```

Expected result:
- Year 1: 10 modules
- Year 2: 7 modules
- Year 3: 9 modules ✨

---

## 🆘 Alternative: Use the SQL File

If you prefer, run the complete SQL file:

1. Open: `supabase/add-3eme-annee-modules.sql`
2. Copy entire content
3. Paste in Supabase SQL Editor
4. Click "Run"

---

**Time needed:** 30 seconds  
**Status:** Ready to fix!
