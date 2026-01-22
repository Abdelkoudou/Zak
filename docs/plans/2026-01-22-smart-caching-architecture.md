# Smart Offline-First Architecture (Enhanced Plan)

**Goal**: Transform QCM Med into a robust, offline-first application with enterprise-grade data synchronization, reducing bandwidth by 90%+ while delivering instant UI interactions.

**Architecture**: 
- **Core Engine**: TanStack Query (v5) for async state management.
- **Persistence Layer**: `AsyncStoragePersister` with 24h+ TTL.
- **Fallbacks**: FileSystem (Static Assets) -> Async Storage (Dynamic Cache) -> Network (Supabase).
- **Sync Strategy**: Stale-While-Revalidate with Background Refetch.

**Tech Stack**: 
- `@tanstack/react-query`
- `@tanstack/react-query-persist-client`
- `@tanstack/query-async-storage-persister`
- `@react-native-async-storage/async-storage`

---

## Phase 1: Foundation (Zero Config Persistence)

**Goal**: Setup the caching engine without changing existing UI logic yet.

### Task 1.1: Install & Configure Dependencies
**Files**:
- Modify: `react-native-med-app/package.json`
- Create: `react-native-med-app/src/lib/query-client.ts`
- Modify: `react-native-med-app/app/_layout.tsx`

**Step 1: Install packages**
```bash
npm install @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

**Step 2: Create Query Client Configuration**
Define global defaults to prevent "loading spinner fatigue" and excessive refetches.
- `staleTime`: 1 hour (Questions/Modules don't change often).
- `gcTime`: 24 hours (Keep unused data in memory/disk for a day).
- `retry`: 2 times with exponential backoff.

**Step 3: Wrap App in Provider**
Initialize `PersistQueryClientProvider` in the root layout. This automatically rehydrates the cache from disk on app launch.

---

## Phase 2: Read-Heavy Optimizations (Modules & Questions)

**Goal**: Make browsing instant by replacing standard `useEffect` fetches with `useQuery`.

### Task 2.1: Migrate Modules Service
**Files**:
- Create: `react-native-med-app/src/hooks/useModules.ts`
- Modify: `react-native-med-app/app/(tabs)/index.tsx`

**Implementation**:
- Wrap `getModulesWithCounts` in `useQuery`.
- **Enhancement**: Use `initialData` from `OfflineContentService`.
    - *Logic*: Check FileSystem -> If exists, inject to Query Cache -> Render immediately -> Fetch Supabase in background to update cache.

### Task 2.2: Migrate Questions Service
**Files**:
- Create: `react-native-med-app/src/hooks/useQuestions.ts`
- Modify: `react-native-med-app/app/questions/list.tsx`

**Implementation**:
- Create `useQuestions(filters)` hook.
- **Key Feature**: `queryKey` includes all filters `['questions', { module: 'Anatomy', year: '2024' }]`.
- **Bandwidth Saver**: Enable `select` option to transform data (e.g., sort, filter) *after* caching, preventing duplicate storage.

---

## Phase 3: Optimistic Updates (The "Magic" Feel)

**Goal**: User actions (Save/Like) feel instantaneous, even offline.

### Task 3.1: Saved Questions Mutation
**Files**:
- Create: `react-native-med-app/src/hooks/useSavedQuestions.ts`
- Modify: `react-native-med-app/src/components/QuestionCard.tsx`

**Implementation**:
- Use `useMutation` for `toggleSaveQuestion`.
- **onMutate**:
    1. Cancel outgoing refetches (prevent overwrite).
    2. Snapshot previous state (for rollback).
    3. **Optimistically update cache**: Manually edit the `['saved_questions']` array in the cache to add/remove the ID.
- **onError**: Rollback to snapshot.
- **onSettled**: Invalidate `['saved_questions']` to ensure eventual consistency.

---

## Phase 4: Intelligent Prefetching

**Goal**: Predict user behavior to eliminate loading screens entirely.

### Task 4.1: Prefetch on Interaction
**Files**:
- Modify: `react-native-med-app/src/components/ModuleCard.tsx`

**Implementation**:
- **Strategy**: When user *presses* a Module Card (before navigation animation starts), trigger `queryClient.prefetchQuery(['questions', { module: id }])`.
- **Result**: By the time the screen transition finishes (~300ms), data is often ready.

### Task 4.2: Prefetch "Next" Content
**Files**:
- Modify: `react-native-med-app/app/module/[id].tsx`

**Implementation**:
- While viewing a module, prefetch the `counts` and `exam_types` for that module.

---

## Validation & Testing Spec

### Bandwidth Test
1. **Reset**: Clear app data.
2. **First Run**: Open app, browse 3 modules. Measure data (expect ~2MB).
3. **Second Run**: Close & Reopen. Browse same modules. Measure data (expect **0KB** network traffic).

### Offline Write Test
1. **Setup**: Airplane Mode ON.
2. **Action**: "Save" 5 questions. UI should update instantly.
3. **Sync**: Airplane Mode OFF.
4. **Verify**: Check Supabase dashboard to see 5 new rows in `saved_questions`.

### Invalidation Test
1. **Setup**: Admin updates a question in DB.
2. **Action**: User pulls-to-refresh on Question List.
3. **Verify**: New data appears, Cache is updated.
