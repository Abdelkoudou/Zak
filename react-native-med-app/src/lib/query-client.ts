// ============================================================================
// TanStack Query Client - Offline-First Configuration
// ============================================================================

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Persister Configuration
// ============================================================================

/**
 * AsyncStorage persister for automatic cache persistence.
 * Throttled to prevent excessive writes during rapid updates.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000, // Batch writes every 1 second
  key: 'QCM_QUERY_CACHE', // Unique key for this app's cache
});

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Global Query Client with optimized defaults for mobile.
 * 
 * Key settings:
 * - gcTime (24h): How long unused data stays in cache
 * - staleTime (30min): How long before data is considered "stale"
 * - retry (2): Number of automatic retries on failure
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache lifetime: Keep unused queries for 24 hours
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      
      // Freshness: Data is fresh for 30 minutes
      // During this time, cached data is returned without refetch
      staleTime: 1000 * 60 * 30, // 30 minutes
      
      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus by default (battery optimization)
      refetchOnWindowFocus: false,
      
      // Don't refetch when network reconnects automatically
      // We'll handle this manually with pull-to-refresh
      refetchOnReconnect: false,
      
      // Network mode: Allow offline access with cached data
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Network mode: Queue mutations when offline
      networkMode: 'offlineFirst',
    },
  },
});

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Clear all cached queries.
 * Use this on logout to prevent data leakage.
 */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  try {
    await AsyncStorage.removeItem('QCM_QUERY_CACHE');
    if (__DEV__) {
      console.log('[QueryClient] Cache cleared');
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[QueryClient] Failed to clear persisted cache:', error);
    }
  }
}

/**
 * Invalidate specific query keys.
 * Forces a refetch on next access.
 */
export async function invalidateQueries(queryKey: string[]): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
}

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query key definitions.
 * Using a factory pattern ensures consistent keys across the app.
 */
export const queryKeys = {
  // Modules
  modules: {
    all: ['modules'] as const,
    byYear: (year: string) => ['modules', { year }] as const,
    withCounts: (year?: string) => ['modules', 'counts', { year }] as const,
    detail: (id: string) => ['modules', 'detail', id] as const,
  },
  
  // Questions
  questions: {
    all: ['questions'] as const,
    list: <T extends object>(filters: T) => ['questions', 'list', filters] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
    count: <T extends object>(filters: T) => ['questions', 'count', filters] as const,
    examYears: (moduleName: string, examType?: string) => 
      ['questions', 'examYears', { moduleName, examType }] as const,
  },
  
  // Saved Questions (User-specific)
  saved: {
    all: ['saved'] as const,
    ids: (userId: string) => ['saved', 'ids', userId] as const,
    list: (userId: string, moduleName?: string) => 
      ['saved', 'list', { userId, moduleName }] as const,
  },
  
  // Resources
  resources: {
    all: ['resources'] as const,
    byModule: (moduleName: string) => ['resources', { moduleName }] as const,
  },
  
  // Exam Types & Courses
  examTypes: {
    withCounts: (moduleName: string, year?: string) => 
      ['examTypes', 'counts', { moduleName, year }] as const,
  },
  
  cours: {
    withCounts: (moduleName: string) => ['cours', 'counts', { moduleName }] as const,
    list: (moduleName: string) => ['cours', 'list', { moduleName }] as const,
  },
} as const;
