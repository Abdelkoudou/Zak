# Fix Supabase Bandwidth Limit (5.743 GB / 5 GB)

## Problem

You're exceeding the **Egress (Bandwidth)** limit, not database storage.

**Current Usage:**
- Egress: 5.743 GB / 5 GB ⚠️ OVER LIMIT
- Database: 0.042 GB ✅ Fine
- Storage: 0.005 GB ✅ Fine

## Why This Happens

With 43 active users:
- Each question fetch includes full text + answers
- No caching = repeated API calls for same data
- Images downloaded multiple times
- Chat API calls add up quickly

## Immediate Fixes (Do These Now)

### 1. Enable Caching in React Native App

Update `react-native-med-app/src/lib/supabase.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Add cache layer
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const CACHE_PREFIX = 'supabase_cache_';

async function getCached(key: string) {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

async function setCache(key: string, data: any) {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export { getCached, setCache };
```

### 2. Update Questions Service to Use Cache

Update `react-native-med-app/src/lib/questions.ts`:

```typescript
import { getCached, setCache } from './supabase';

export async function getQuestions(filters: QuestionFilters): Promise<{
  questions: QuestionWithAnswers[];
  total: number;
  error: string | null
}> {
  try {
    // Generate cache key from filters
    const cacheKey = `questions_${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log('📦 Using cached questions');
      return cached;
    }

    // Check offline content first (existing code)
    if (filters.module_name) {
      const year = filters.year ? parseInt(filters.year) : undefined;
      const offlineData = await OfflineContentService.getModuleContent(filters.module_name, year)
      if (offlineData) {
        // ... existing offline logic ...
        const result = { questions, total, error: null };
        await setCache(cacheKey, result);
        return result;
      }
    }

    // Fetch from Supabase (existing code)
    let query = supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `, { count: 'exact' })

    // ... rest of existing code ...

    const result = {
      questions: questionsWithSortedAnswers as QuestionWithAnswers[],
      total: count || 0,
      error: null
    };

    // Cache the result
    await setCache(cacheKey, result);

    return result;
  } catch (error) {
    return { questions: [], total: 0, error: 'Failed to fetch questions' }
  }
}
```

### 3. Reduce API Call Frequency

Update `react-native-med-app/src/lib/modules.ts`:

```typescript
import { getCached, setCache } from './supabase';

export async function getModules(year?: YearLevel): Promise<{
  modules: Module[];
  error: string | null
}> {
  try {
    const cacheKey = `modules_${year || 'all'}`;
    
    // Check cache (modules rarely change)
    const cached = await getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from Supabase
    let query = supabase
      .from('modules')
      .select('*')
      .order('name', { ascending: true });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) {
      return { modules: [], error: error.message };
    }

    const result = { modules: data as Module[], error: null };
    
    // Cache for longer (modules don't change often)
    await setCache(cacheKey, result);

    return result;
  } catch (error) {
    return { modules: [], error: 'Failed to fetch modules' };
  }
}
```

### 4. Optimize Question Fetching (Pagination)

Update `react-native-med-app/app/practice/[moduleId].tsx`:

```typescript
// Instead of loading all questions at once:
const { questions } = await getQuestions({
  module_name: moduleName,
  exam_type: examType,
  limit: 20, // Only load 20 at a time
  offset: 0
});

// Load more as needed
```

### 5. Enable Supabase CDN for Images

In Supabase Dashboard:
1. Go to Storage → question-images bucket
2. Enable "Public bucket" if not already
3. Images will be cached by CDN automatically

### 6. Reduce Chat API Bandwidth

Update `db-interface/app/api/chat/route.ts`:

```typescript
// Add response compression
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // ... existing code ...
  
  // Return compressed response
  return new NextResponse(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip', // Enable compression
    },
  });
}
```

## Long-Term Solutions

### Option 1: Upgrade to Pro Plan ($25/month)

Benefits:
- 250 GB bandwidth (50x more)
- 8 GB database
- 100 GB storage
- Better performance

Go to: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/settings/billing

### Option 2: Implement Aggressive Caching

1. **Cache everything for 24 hours**
2. **Use offline-first architecture** (already partially implemented)
3. **Lazy load images** (only when visible)
4. **Batch API requests** (fetch multiple resources in one call)

### Option 3: Use CDN for Static Content

Move question images to:
- Cloudflare R2 (free tier: 10 GB/month)
- Cloudinary (free tier: 25 GB/month)
- ImgIX

## Quick Win: Clear Current Cycle

Your billing cycle ends **18 Jan 2026**. After that, bandwidth resets to 0.

Until then:
1. Implement caching (above)
2. Ask users to use app less frequently
3. Or upgrade to Pro plan

## Monitoring

Add bandwidth tracking to your admin dashboard:

```typescript
// In db-interface/app/page.tsx
const checkBandwidth = async () => {
  // Supabase doesn't expose usage API yet
  // Monitor manually in dashboard
  console.log('Check: https://supabase.com/dashboard/project/tkthvgvjecihqfnknosj/settings/usage');
};
```

## Expected Impact

After implementing caching:
- **70-90% reduction** in bandwidth usage
- Faster app performance
- Better offline support
- Lower costs

## Priority Actions (Do Today)

1. ✅ Add caching to `supabase.ts`
2. ✅ Update `questions.ts` to use cache
3. ✅ Update `modules.ts` to use cache
4. ✅ Add pagination to question loading
5. ⏳ Wait for billing cycle reset (18 Jan 2026)

After these changes, you should stay well under 5 GB/month.
