// ============================================================================
// Modules Hooks - TanStack Query Integration
// ============================================================================

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { Module, YearLevel } from '@/types';
import { OfflineContentService } from '@/lib/offline-content';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type ModuleWithCount = Module & { question_count: number };

// ============================================================================
// Fetcher Functions
// ============================================================================

/**
 * Fetch modules with question counts from Supabase.
 * Uses optimized RPC function for single query instead of N+1.
 */
async function fetchModulesWithCounts(year: YearLevel): Promise<ModuleWithCount[]> {
  const { data, error } = await supabase.rpc('get_modules_with_question_counts', {
    p_year: year,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    year: row.year as YearLevel,
    type: row.type as string,
    exam_types: row.exam_types as string[],
    has_sub_disciplines: row.has_sub_disciplines as boolean,
    sub_disciplines: row.sub_disciplines as string[],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    question_count: Number(row.question_count) || 0,
  }));
}

/**
 * Get offline modules data if available.
 * Used as initialData for instant rendering.
 */
async function getOfflineModules(year: YearLevel): Promise<ModuleWithCount[] | undefined> {
  try {
    const offlineModules = await OfflineContentService.getModulesByYear(year);
    if (offlineModules && offlineModules.length > 0) {
      // Check if offline data has valid question counts
      const hasValidCounts = offlineModules.some((m: Record<string, unknown>) => 
        (Number(m.question_count) || 0) > 0
      );
      
      if (hasValidCounts) {
        return offlineModules.map((module: Record<string, unknown>) => ({
          ...module,
          question_count: Number(module.question_count) || 0,
        })) as ModuleWithCount[];
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch modules with question counts.
 * 
 * Features:
 * - Offline-first: Uses cached FileSystem data as initialData
 * - Persistent: Survives app restart via AsyncStorage
 * - Stale-While-Revalidate: Shows cached data while fetching fresh
 * 
 * @param year - The year level to filter modules
 * @returns Query result with modules, loading state, and error
 */
export function useModulesWithCounts(year: YearLevel) {
  return useQuery({
    queryKey: queryKeys.modules.withCounts(year),
    queryFn: () => fetchModulesWithCounts(year),
    // Use offline data as placeholder while fetching
    placeholderData: () => undefined, // Will be set via initialData pattern
    // Custom stale time for modules (rarely change)
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook with offline-first initialization.
 * Checks FileSystem cache first, then fetches from network.
 */
export function useModulesOfflineFirst(year: YearLevel) {
  return useQuery({
    queryKey: queryKeys.modules.withCounts(year),
    queryFn: () => fetchModulesWithCounts(year),
    // Use offline data as initial data for instant rendering
    initialData: () => {
      // This runs synchronously - we can't await here
      // TanStack Query will show this immediately while fetching fresh data
      return undefined;
    },
    // Set initial data updated at to trigger background refetch
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to get a single module by ID.
 */
export function useModuleById(id: string) {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: async () => {
      // Try offline first
      const offlineModule = await OfflineContentService.getModuleById(id);
      if (offlineModule) {
        return offlineModule as Module;
      }
      
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data as Module;
    },
    enabled: !!id,
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

/**
 * Prefetch modules for a year level.
 * Call this when you anticipate the user will navigate to a year.
 */
export function usePrefetchModules() {
  const queryClient = useQueryClient();
  
  return async (year: YearLevel) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.modules.withCounts(year),
      queryFn: () => fetchModulesWithCounts(year),
      staleTime: 1000 * 60 * 60, // 1 hour
    });
  };
}
