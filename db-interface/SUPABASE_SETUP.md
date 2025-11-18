# Supabase Setup for DB Interface

## Prerequisites

1. ✅ Supabase project created
2. ✅ Database schema applied (`supabase/schema.sql`)
3. ✅ Seed data inserted (`supabase/seed.sql`)
4. ✅ RLS policies applied (`supabase/rls-policies.sql`)

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

## Step 2: Configure Environment Variables

1. In the `db-interface` folder, create a `.env.local` file:

```bash
cd db-interface
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 3: Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client library
- All other Next.js dependencies

## Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at: http://localhost:3001

## Step 5: Test the Connection

1. Open http://localhost:3001/questions
2. Click "➕ Nouvelle Question"
3. Fill in the form:
   - Select year, module, exam type
   - Enter question text
   - Fill in answers (A-E)
   - Mark at least one as correct
4. Click "✅ Enregistrer la Question"
5. If successful, you'll see: "✅ Question ajoutée avec succès!"

## Verification

### Check if Supabase is Connected

Open browser console (F12) and check for:
- ✅ No connection errors
- ✅ Questions load successfully
- ✅ New questions save to database

### Verify in Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Select `questions` table
3. You should see your newly added question
4. Select `answers` table
5. You should see the 5 answers for your question

## Features Implemented

### Questions Page
- ✅ Load questions from Supabase
- ✅ Create new questions with answers
- ✅ Delete questions
- ✅ Group questions by module/exam type
- ✅ Real-time statistics
- ✅ Error handling
- ✅ Loading states

### API Functions
- ✅ `createQuestion()` - Add question with answers
- ✅ `getQuestions()` - Fetch all questions with filters
- ✅ `deleteQuestion()` - Remove question
- ✅ `getModules()` - Fetch predefined modules

## Troubleshooting

### Issue: "Failed to load questions"

**Possible causes:**
1. Supabase credentials not set
2. RLS policies not applied
3. Network connection issue

**Solution:**
```bash
# Check .env.local exists and has correct values
cat .env.local

# Verify Supabase connection in browser console
# Should see no errors
```

### Issue: "Permission denied"

**Cause:** RLS policies not applied or user not authenticated

**Solution:**
1. Re-run `rls-policies.sql` in Supabase SQL Editor
2. For now, you can disable RLS temporarily for testing:
```sql
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE answers DISABLE ROW LEVEL SECURITY;
```

### Issue: "Module not found"

**Cause:** Seed data not inserted

**Solution:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM modules; -- Should return 17

-- If 0, run seed.sql again
```

### Issue: "Duplicate key value"

**Cause:** Question with same year/module/exam/number already exists

**Solution:**
- Change the question number
- Or delete the existing question first

## Next Steps

### 1. Add Authentication (Optional for now)

For production, you'll want to add authentication:

```typescript
// lib/auth.ts
import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}
```

### 2. Add Resources Page

Similar to questions, create API functions for resources:

```typescript
// lib/api/resources.ts
export async function createResource(data) {
  // Similar to createQuestion
}
```

### 3. Add Import/Export

Connect the import/export page to Supabase:

```typescript
// Export all questions
const { data } = await supabase.from('questions').select('*, answers(*)');

// Import questions
for (const question of importedData) {
  await createQuestion(question);
}
```

## API Reference

### Create Question

```typescript
import { createQuestion } from '@/lib/api/questions';

const result = await createQuestion({
  year: '1',
  module_name: 'Anatomie',
  sub_discipline: 'Anatomie', // optional
  exam_type: 'EMD1',
  number: 1,
  question_text: 'Question text here',
  explanation: 'Explanation here', // optional
  answers: [
    {
      option_label: 'A',
      answer_text: 'Answer A',
      is_correct: true,
      display_order: 1,
    },
    // ... more answers
  ],
});

if (result.success) {
  console.log('Question created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Get Questions

```typescript
import { getQuestions } from '@/lib/api/questions';

// Get all questions
const result = await getQuestions();

// Get filtered questions
const result = await getQuestions({
  year: '1',
  module_name: 'Anatomie',
  exam_type: 'EMD1',
});

if (result.success) {
  console.log('Questions:', result.data);
}
```

### Delete Question

```typescript
import { deleteQuestion } from '@/lib/api/questions';

const result = await deleteQuestion('question-uuid');

if (result.success) {
  console.log('Question deleted');
}
```

## Security Notes

### For Development
- Using `anon` key is fine
- RLS policies protect data
- No sensitive data exposed

### For Production
- Enable RLS on all tables ✅
- Add authentication
- Use service role key only on server
- Validate all inputs
- Add rate limiting

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify RLS policies are applied
4. Check `.env.local` has correct values

---

**Status**: ✅ Supabase Integration Complete
**Next**: Add authentication and deploy
