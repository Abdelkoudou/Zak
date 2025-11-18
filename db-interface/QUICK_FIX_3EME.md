# ⚡ Quick Fix - 3ème Année Error (30 seconds)

## The Error
```
❌ violates foreign key constraint "questions_module_name_fkey"
```

## The Fix

### 1️⃣ Open Supabase SQL Editor
https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/editor

### 2️⃣ Copy & Paste This SQL

```sql
-- Add 3ème Année modules to database
INSERT INTO public.modules (name, year, type, exam_types, has_sub_disciplines) VALUES
('Appareil Cardio-vasculaire et respiratoire, Psychologie Médicale et Semiologie Générale', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Neurologique, Locomoteur et Cutané', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Endocrines, Appareil de Reproduction et Appareil Urinaire', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Appareil Digestif et Organes Hématopoïétiques', '3'::year_level, 'uei', ARRAY['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'], true),
('Anatomie pathologique', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Immunologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Pharmacologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Microbiologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false),
('Parasitologie', '3'::year_level, 'standalone', ARRAY['EMD', 'Rattrapage'], false)
ON CONFLICT (name, year) DO NOTHING;
```

### 3️⃣ Click "Run"

Should see: `✅ Success. 9 rows returned`

### 4️⃣ Try Again

Go to /questions and add a 3ème année question. ✅ Works!

---

**Done!** 🎉
