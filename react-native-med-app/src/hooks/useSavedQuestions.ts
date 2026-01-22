// ============================================================================
// Saved Questions Hooks - TanStack Query with Optimistic Updates
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { QuestionWithAnswers } from '@/types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

interface ToggleSaveResult {
  isSaved: boolean;
  error: string | null;
}

// ============================================================================
// Fetcher Functions
// ============================================================================

async function fetchSavedQuestionIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_questions')
    .select('question_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((s) => s.question_id);
}

async function fetchSavedQuestions(
  userId: string,
  moduleName?: string
): Promise<QuestionWithAnswers[]> {
  // Get saved question IDs
  const { data: savedData, error: savedError } = await supabase
    .from('saved_questions')
    .select('question_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (savedError) {
    throw new Error(savedError.message);
  }

  if (!savedData || savedData.length === 0) {
    return [];
  }

  const questionIds = savedData.map((s) => s.question_id);

  // Fetch questions with answers
  let questionsQuery = supabase
    .from('questions')
    .select('*, answers (*)')
    .in('id', questionIds);

  if (moduleName) {
    questionsQuery = questionsQuery.eq('module_name', moduleName);
  }

  const { data: questionsData, error: questionsError } = await questionsQuery;

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  // Sort answers
  return (questionsData || []).map((q) => ({
    ...q,
    answers: (q.answers || []).sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
    ),
  })) as QuestionWithAnswers[];
}

// ============================================================================
// Mutation Functions
// ============================================================================

async function saveQuestion(userId: string, questionId: string): Promise<void> {
  const { error } = await supabase.from('saved_questions').insert({
    user_id: userId,
    question_id: questionId,
  });

  // Ignore duplicate error (23505)
  if (error && error.code !== '23505') {
    throw new Error(error.message);
  }
}

async function unsaveQuestion(userId: string, questionId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get saved question IDs for a user.
 * Lightweight query for checking if a question is saved.
 */
export function useSavedQuestionIds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.saved.ids(userId || ''),
    queryFn: () => fetchSavedQuestionIds(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get saved questions with full details.
 */
export function useSavedQuestions(userId: string | undefined, moduleName?: string) {
  return useQuery({
    queryKey: queryKeys.saved.list(userId || '', moduleName),
    queryFn: () => fetchSavedQuestions(userId!, moduleName),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to toggle save/unsave a question with OPTIMISTIC UPDATES.
 * 
 * This provides instant UI feedback:
 * 1. User taps "Save" button
 * 2. UI immediately shows "Saved" state
 * 3. Server request happens in background
 * 4. If server fails, UI rolls back to previous state
 */
export function useToggleSaveQuestion(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      isCurrentlySaved,
    }: {
      questionId: string;
      isCurrentlySaved: boolean;
    }): Promise<ToggleSaveResult> => {
      if (!userId) {
        return { isSaved: isCurrentlySaved, error: 'Not authenticated' };
      }

      if (isCurrentlySaved) {
        await unsaveQuestion(userId, questionId);
        return { isSaved: false, error: null };
      } else {
        await saveQuestion(userId, questionId);
        return { isSaved: true, error: null };
      }
    },

    // ========================================
    // OPTIMISTIC UPDATE: Instant UI feedback
    // ========================================
    onMutate: async ({ questionId, isCurrentlySaved }) => {
      if (!userId) return;

      // 1. Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.saved.ids(userId),
      });

      // 2. Snapshot the previous value for potential rollback
      const previousIds = queryClient.getQueryData<string[]>(
        queryKeys.saved.ids(userId)
      );

      // 3. Optimistically update the cache
      queryClient.setQueryData<string[]>(
        queryKeys.saved.ids(userId),
        (old = []) => {
          if (isCurrentlySaved) {
            // Remove from saved
            return old.filter((id) => id !== questionId);
          } else {
            // Add to saved
            return [...old, questionId];
          }
        }
      );

      // 4. Return context with previous value for rollback
      return { previousIds };
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousIds && userId) {
        queryClient.setQueryData(queryKeys.saved.ids(userId), context.previousIds);
      }
    },

    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      if (userId) {
        // Invalidate to ensure eventual consistency
        queryClient.invalidateQueries({
          queryKey: queryKeys.saved.ids(userId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.saved.list(userId, undefined),
        });
      }
    },
  });
}

/**
 * Helper hook to check if a specific question is saved.
 * Uses the cached saved IDs for O(1) lookup.
 */
export function useIsQuestionSaved(
  userId: string | undefined,
  questionId: string
): boolean {
  const { data: savedIds } = useSavedQuestionIds(userId);
  return savedIds?.includes(questionId) ?? false;
}
