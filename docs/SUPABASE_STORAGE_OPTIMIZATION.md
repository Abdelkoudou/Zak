# Supabase Storage Optimization Guide

Your Supabase project is at **5.74 GB / 5 GB** usage. Here's how to identify and fix the issue.

## Step 1: Identify What's Using Space

### Check in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/settings/usage
2. Look at the breakdown:
   - **Database** (most likely culprit)
   - **Storage** (images)
   - **Bandwidth** (API calls)

### Run Analysis Script

```bash
cd db-interface
node scripts/analyze-database-size.mjs
```

This will show you row counts for each table.

## Step 2: Common Issues & Solutions

### Issue 1: Large Database Tables

**Most likely tables:**
- `test_attempts` - User practice history (grows quickly)
- `chat_messages` - AI chat history (can be very large)
- `questions` - Question text and explanations
- `answers` - Answer text

**Solutions:**

#### A. Clean Old Data (Recommended)

```bash
cd db-interface
node scripts/cleanup-database.mjs
```

This will prompt you to delete:
- Test attempts older than 30 days
- Chat sessions older than 7 days
- Inactive device sessions (90+ days)

#### B. Manual Cleanup in SQL Editor

Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/sql/new

```sql
-- Delete old test attempts (keep last 30 days)
DELETE FROM test_attempts 
WHERE completed_at < NOW() - INTERVAL '30 days';

-- Delete old chat messages (keep last 7 days)
DELETE FROM chat_messages 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Delete old chat sessions (keep last 7 days)
DELETE FROM chat_sessions 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Reclaim space
VACUUM ANALYZE;
```

#### C. Add Automatic Cleanup Policies

Create a cron job to auto-delete old data:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto-delete old test attempts weekly
SELECT cron.schedule(
  'cleanup-old-test-attempts',
  '0 2 * * 0', -- Every Sunday at 2 AM
  $$DELETE FROM test_attempts WHERE completed_at < NOW() - INTERVAL '30 days'$$
);

-- Auto-delete old chat messages weekly
SELECT cron.schedule(
  'cleanup-old-chat-messages',
  '0 3 * * 0', -- Every Sunday at 3 AM
  $$DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '7 days'$$
);
```

### Issue 2: Storage Bucket (Images)

**Check storage usage:**
1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/storage/buckets
2. Check `question-images` bucket size

**Solutions:**

#### A. Compress Images Before Upload

Update the image upload handler in `db-interface/app/questions/page.tsx`:

```typescript
// Add image compression
const compressImage = async (file: File): Promise<File> => {
  // Use browser-image-compression library
  const options = {
    maxSizeMB: 0.5, // Max 500KB
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  return await imageCompression(file, options);
};

// In handleImageUpload:
const compressedFile = await compressImage(file);
// Then upload compressedFile instead of file
```

#### B. Delete Unused Images

```sql
-- Find questions without images
SELECT COUNT(*) FROM questions WHERE image_url IS NULL;

-- Find orphaned images (images not referenced by any question)
-- This requires manual checking in Storage bucket
```

### Issue 3: Bandwidth (Less Common)

If bandwidth is the issue:
- Enable caching headers
- Use CDN for static assets
- Optimize API queries (use pagination, limit fields)

## Step 3: Prevent Future Issues

### 1. Add Data Retention Policies

```sql
-- In your migrations, add:
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old test attempts
  DELETE FROM test_attempts 
  WHERE completed_at < NOW() - INTERVAL '30 days';
  
  -- Delete old chat messages
  DELETE FROM chat_messages 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Delete old chat sessions
  DELETE FROM chat_sessions 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

### 2. Optimize Question Storage

- Limit `question_text` to 2000 characters
- Limit `explanation` to 1000 characters
- Store long content in separate table if needed

### 3. Monitor Usage

Add to your admin dashboard:

```typescript
// Show storage usage
const { data: usage } = await supabase
  .rpc('get_database_size');

console.log('Database size:', usage);
```

## Step 4: Upgrade Plan (If Needed)

If you need more space:

1. Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/settings/billing
2. Upgrade to **Pro Plan** ($25/month):
   - 8 GB database
   - 100 GB bandwidth
   - 100 GB storage

Or enable **Spend Cap** to pay for overages.

## Quick Wins (Do These First)

1. **Delete old chat messages** (usually the biggest space hog)
2. **Delete old test attempts** (keeps growing)
3. **Run VACUUM ANALYZE** (reclaims space)
4. **Compress images** (if using Storage)

## Need Help?

Run the analysis script first:
```bash
node scripts/analyze-database-size.mjs
```

Then run cleanup:
```bash
node scripts/cleanup-database.mjs
```

This should free up significant space immediately.
