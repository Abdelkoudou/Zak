# ⚡ Quick Fix - Create Storage Bucket (1 minute)

## The Error You're Seeing

```
❌ Bucket not found
```

## The Fix (3 Steps)

### 1️⃣ Open Supabase Storage

Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/storage/buckets

### 2️⃣ Create Bucket

Click **"New bucket"** and fill:
- Name: `questions`
- Public: ✅ **Check this box**
- Click **"Create bucket"**

### 3️⃣ Try Export Again

Go to: http://localhost:3001/export  
Click: **"🚀 Export & Upload to Storage"**

✅ **Done!**

---

## Why This Happened

The export tries to upload JSON files to Supabase Storage, but the "questions" bucket doesn't exist yet. Creating it takes 30 seconds.

---

## What Happens After

Once the bucket is created:
1. Export will upload JSON files
2. Files will be publicly accessible
3. Mobile app can download them
4. Students get questions instantly!

---

**Total time:** 1 minute  
**Result:** Export works! 🎉
