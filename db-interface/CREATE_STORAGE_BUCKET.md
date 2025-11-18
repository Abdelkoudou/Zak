# 📦 Create Supabase Storage Bucket

## ❌ Current Error

```
❌ Failed to upload year1/s.s.h.json: StorageApiError: Bucket not found
status: 400, statusCode: '404'
```

## 🎯 Solution: Create the Storage Bucket

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard
2. Select your project: **tkthvgvjecihqfnknosj**
3. Click **Storage** in the left sidebar

### Step 2: Create "questions" Bucket

1. Click **"New bucket"** button
2. Fill in the form:
   - **Name:** `questions`
   - **Public bucket:** ✅ **YES** (check this box)
   - **File size limit:** Leave default (50MB is fine)
   - **Allowed MIME types:** Leave empty (allow all)

3. Click **"Create bucket"**

### Step 3: Verify Bucket Created

You should see the "questions" bucket in the list with:
- Name: questions
- Status: Public
- Files: 0

---

## 🔄 Alternative: SQL Command

If you prefer SQL, run this in **SQL Editor**:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('questions', 'questions', true);

-- Verify bucket created
SELECT * FROM storage.buckets WHERE name = 'questions';
```

---

## ✅ Test Export Again

1. Go back to: http://localhost:3001/export
2. Click **"🚀 Export & Upload to Storage"**
3. Should now work! ✅

Expected result:
```
✅ Export Successful!
Total Questions: 2
Total Modules: 1
Version: 1.0.0

Exported Modules:
• year1_s.s.h

📱 Mobile app users will receive these updates on next launch!
```

---

## 📁 What Gets Created

After successful export, in Supabase Storage → questions bucket:

```
questions/
├── version.json
└── year1/
    └── s.s.h.json (2 questions)
```

---

## 🔍 Verify Files Uploaded

### Option 1: Supabase Dashboard

1. Go to **Storage** → **questions** bucket
2. You should see:
   - `version.json`
   - `year1/` folder
     - `s.s.h.json`

### Option 2: Check via URL

Once uploaded, files are publicly accessible at:

```
https://tkthvgvjecihqfnknosj.supabase.co/storage/v1/object/public/questions/version.json
https://tkthvgvjecihqfnknosj.supabase.co/storage/v1/object/public/questions/year1/s.s.h.json
```

Try opening these URLs in your browser after export succeeds.

---

## 🎉 Next Steps

1. ✅ Create storage bucket (this guide)
2. ✅ Export questions to JSON
3. ✅ Verify files in Supabase Storage
4. 🔄 Build mobile app (next phase)
5. 📱 Mobile app downloads JSON files

---

**Time needed:** 1 minute  
**Status:** Ready to create bucket!
