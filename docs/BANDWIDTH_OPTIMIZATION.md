# Bandwidth Optimization Guide

Your Supabase bandwidth (Egress) exceeded the 5 GB free tier limit. Here's how to fix and prevent it.

## Current Usage
- **Egress**: 5.743 GB / 5 GB (143% - OVER LIMIT)
- **Database**: 0.042 GB (0.8% - excellent!)
- **Storage**: 0.005 GB (0.1% - excellent!)

## Root Cause
Bandwidth spike on January 8-9 (over 1 GB in one day) from:
- API calls fetching large amounts of data
- Mobile app downloading questions without pagination
- AI chat responses with large context

## Solutions

### 1. Implement Pagination (Critical)

#### Mobile App - Questions List

Update `react-native-med-app/src/lib/questions.ts`:

```typescript
// Add pagination to getQuestions
export async function getQuestions(filters: QuestionFilters): Promise<{
  questions: QuestionWithAnswers[];
  total: number;
  error: string | null
}> {
  // Set default limit if not provided
  const limit = filters.limit || 20; // Default to 20 questions per page
  const offset = filters.offset || 0;

  // ... rest of the function
  
  // Always apply pagination
  query = query.limit(limit);
  if (offset > 0) {
    query = query.range(offset, offset + limit - 1);
  }
  
  // ... rest of the function
}
```

#### Admin Interface - Questions Page

The admin interface already has pagination, but ensure it's being used:

```typescript
// In db-interface/app/questions/page.tsx
// Make sure you're not loading all questions at once
const result = await getQuestions({
  year: listFilters.year || undefined,
  module_name: listFilters.moduleId || undefined,
  // ... other filters
  limit: 50, // Limit to 50 questions per page
  offset: (currentPage - 1) * 50
});
```

### 2. Reduce Response Size

#### Select Only Needed Fields

Instead of `select('*')`, specify fields:

```typescript
// Before (fetches everything)
const { data } = await supabase
  .from('questions')
  .select('*, answers(*)');

// After (only what you need)
const { data } = await supabase
  .from('questions')
  .select('id, question_text, number, exam_type, answers(option_label, answer_text, is_correct)');
```

#### Compress Large Text Fields

For questions with long text, consider:

```typescript
// Add to API routes
export async function GET(request: Request) {
  const data = await fetchQuestions();
  
  // Compress response
  const compressed = gzip(JSON.stringify(data));
  
  return new Response(compressed, {
    headers: {
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/json'
    }
  });
}
```

### 3. Implement Caching

#### Client-Side Caching (React Native)

```typescript
// In react-native-med-app/src/lib/questions.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'questions_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getQuestions(filters: QuestionFilters) {
  // Check cache first
  const cacheKey = `${CACHE_KEY}_${JSON.stringify(filters)}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return { questions: data, total: data.length, error: null };
    }
  }
  
  // Fetch from API
  const result = await fetchFromSupabase(filters);
  
  // Cache the result
  await AsyncStorage.setItem(cacheKey, JSON.stringify({
    data: result.questions,
    timestamp: Date.now()
  }));
  
  return result;
}
```

#### Server-Side Caching (Next.js)

```typescript
// In db-interface/app/api/questions/route.ts
import { unstable_cache } from 'next/cache';

export const GET = unstable_cache(
  async (request: Request) => {
    // Your existing logic
    const questions = await getQuestions(filters);
    return Response.json(questions);
  },
  ['questions-list'],
  { revalidate: 3600 } // Cache for 1 hour
);
```

### 4. Optimize AI Chat (Major Bandwidth User)

#### Limit Context Size

```typescript
// In db-interface/app/api/chat/route.ts
const relevantDocs = await searchKnowledge(query, {
  limit: 3, // Reduce from 5 to 3
  maxTokens: 1000 // Limit context size
});
```

#### Stream Responses

```typescript
// Use streaming instead of full response
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
  stream: true // Enable streaming
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

### 5. Use Offline-First Strategy

Your app already has offline content support. Maximize it:

```typescript
// In react-native-med-app/src/lib/questions.ts
export async function getQuestions(filters: QuestionFilters) {
  // ALWAYS check offline first
  if (filters.module_name) {
    const offlineData = await OfflineContentService.getModuleContent(
      filters.module_name,
      filters.year ? parseInt(filters.year) : undefined
    );
    
    if (offlineData) {
      // Use offline data - NO BANDWIDTH USED!
      return processOfflineData(offlineData, filters);
    }
  }
  
  // Only fetch online if offline not available
  return fetchFromSupabase(filters);
}
```

### 6. Monitor Bandwidth Usage

Add bandwidth monitoring to your admin dashboard:

```typescript
// Create db-interface/app/api/usage/route.ts
export async function GET() {
  // Fetch from Supabase Management API
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/usage`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`
      }
    }
  );
  
  const usage = await response.json();
  return Response.json(usage);
}
```

Display in admin UI:

```typescript
// In db-interface/app/page.tsx
const [usage, setUsage] = useState(null);

useEffect(() => {
  fetch('/api/usage')
    .then(r => r.json())
    .then(setUsage);
}, []);

// Show warning if > 80%
{usage?.egress > 4000000000 && (
  <div className="alert alert-warning">
    ⚠️ Bandwidth usage: {(usage.egress / 1000000000).toFixed(2)} GB / 5 GB
  </div>
)}
```

## Quick Wins (Implement Now)

1. **Add pagination to all question fetches** (limit: 20-50)
2. **Enable offline-first in mobile app** (already implemented, just prioritize it)
3. **Reduce AI chat context size** (limit: 3 docs instead of 5)
4. **Cache frequently accessed data** (modules, resources)

## Long-Term Solutions

1. **Upgrade to Pro Plan** ($25/month for 250 GB bandwidth)
2. **Use CDN for static content** (images, resources)
3. **Implement GraphQL** (fetch only needed fields)
4. **Add request throttling** (rate limiting)

## Monitoring

Check bandwidth daily during development:
```bash
# Add to package.json scripts
"check-usage": "node scripts/check-supabase-usage.mjs"
```

## Expected Savings

- **Pagination**: 70-80% reduction
- **Offline-first**: 50-60% reduction
- **Caching**: 40-50% reduction
- **AI optimization**: 20-30% reduction

Combined: **80-90% bandwidth reduction**

## Next Billing Cycle

Your usage resets on **January 18, 2026**. Implement these changes before then to avoid hitting the limit again.
