// ============================================================================
// Questions Hooks - TanStack Query Integration
// ============================================================================

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { QuestionWithAnswers, ExamType, YearLevel } from '@/types';
import { OfflineContentService } from '@/lib/offline-content';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface QuestionFilters {
  module_name?: string;
  exam_type?: ExamType;
  sub_discipline?: string;
  cours?: string;
  year?: YearLevel;
  exam_year?: number;
  limit?: number;
  offset?: number;
}

interface QuestionsResult {
  questions: QuestionWithAnswers[];
  total: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getExamTypeWeight = (type: string | undefined | null) => {
  if (!type) return 99;
  const t = type.toLowerCase();
  if (t.includes('emd')) return 1;
  if (t.includes('rattrapage')) return 2;
  if (t.includes('residanat')) return 3;
  return 10;
};

function sortQuestions(questions: QuestionWithAnswers[]): QuestionWithAnswers[] {
  return questions.sort((a, b) => {
    // 1. Year (Descending: Latest First)
    const yearA = a.exam_year || 0;
    const yearB = b.exam_year || 0;
    if (yearA !== yearB) return yearB - yearA;

    // 2. Exam Type (Session)
    const typeA = getExamTypeWeight(a.exam_type);
    const typeB = getExamTypeWeight(b.exam_type);
    if (typeA !== typeB) return typeA - typeB;

    // 3. Number (Ascending)
    return (a.number || 0) - (b.number || 0);
  });
}

// ============================================================================
// Fetcher Functions
// ============================================================================

/**
 * Fetch questions from offline storage first, then Supabase.
 */
async function fetchQuestions(filters: QuestionFilters): Promise<QuestionsResult> {
  // Try offline content first
  if (filters.module_name) {
    const yearNum = filters.year ? parseInt(filters.year) : undefined;
    const offlineData = await OfflineContentService.getModuleContent(
      filters.module_name,
      yearNum
    );

    if (offlineData && offlineData.questions && offlineData.questions.length > 0) {
      let questions = offlineData.questions.map((q: Record<string, unknown>) => ({
        id: q.id,
        year: q.year || q.study_year,
        module_name: q.module || q.module_name,
        sub_discipline: q.sub_discipline,
        exam_type: q.exam_type,
        exam_year: q.exam_year,
        number: q.number,
        question_text: q.question_text,
        explanation: q.explanation,
        image_url: q.image_url,
        cours: q.cours || [],
        answers: ((q.answers as Record<string, unknown>[]) || []).map((a) => ({
          id: a.id || `${q.id}_${a.label || a.option_label}`,
          question_id: q.id,
          option_label: a.label || a.option_label,
          answer_text: a.text || a.answer_text,
          is_correct: a.is_correct,
          display_order: a.display_order,
        })),
      })) as QuestionWithAnswers[];

      if (filters.exam_type && filters.exam_type.trim() !== '') {
        questions = questions.filter((q) => q.exam_type === filters.exam_type);
      }
      if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
        questions = questions.filter((q) => q.sub_discipline === filters.sub_discipline);
      }
      if (filters.cours && filters.cours.trim() !== '') {
        const normalize = (s: string) => s.trim().toLowerCase();
        const target = normalize(filters.cours as string);
        questions = questions.filter((q) => 
          Array.isArray(q.cours) && (q.cours as string[]).some(c => normalize(c) === target)
        );
      }
      if (filters.exam_year) {
        questions = questions.filter((q) => q.exam_year === filters.exam_year);
      }

      // Sort chronologically
      questions = sortQuestions(questions);

      // Pagination
      const total = questions.length;
      if (filters.offset !== undefined && filters.limit !== undefined) {
        questions = questions.slice(filters.offset, filters.offset + filters.limit);
      } else if (filters.limit) {
        questions = questions.slice(0, filters.limit);
      }

      if (questions.length === 0 && filters.cours) {
        // Fall back to Supabase if course not found in offline data
      } else {
        return { questions, total };
      }
    }
  }

  // Fallback to Supabase
  let query = supabase
    .from('questions')
    .select('*, answers (*)', { count: 'exact' });

  if (filters.module_name && filters.module_name.trim() !== '') {
    query = query.eq('module_name', filters.module_name);
  }
  if (filters.exam_type && filters.exam_type.trim() !== '') {
    query = query.eq('exam_type', filters.exam_type);
  }
  if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
    query = query.eq('sub_discipline', filters.sub_discipline);
  }
  if (filters.cours && filters.cours.trim() !== '') {
    query = query.contains('cours', [filters.cours]);
  }
  if (filters.year && filters.year.trim() !== '') {
    query = query.eq('year', filters.year);
  }
  if (filters.exam_year) {
    query = query.eq('exam_year', filters.exam_year);
  }

  // Sorting
  query = query
    .order('exam_year', { ascending: false })
    .order('exam_type', { ascending: true })
    .order('number', { ascending: true });

  // Pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Sort answers by display_order
  const questionsWithSortedAnswers = (data || []).map((q) => ({
    ...q,
    answers: (q.answers || []).sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
    ),
  }));

  return {
    questions: sortQuestions(questionsWithSortedAnswers as QuestionWithAnswers[]),
    total: count || 0,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch questions with filters.
 * 
 * Features:
 * - Offline-first: Uses FileSystem cache when available
 * - Cached: Persisted to AsyncStorage
 * - Paginated: Supports limit/offset
 */
export function useQuestions(filters: QuestionFilters) {
  return useQuery({
    queryKey: queryKeys.questions.list(filters),
    queryFn: () => fetchQuestions(filters),
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!filters.module_name, // Only fetch if module is specified
  });
}

/**
 * Hook to fetch a single question by ID.
 */
export function useQuestionById(id: string) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*, answers (*)')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);

      return {
        ...data,
        answers: (data.answers || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      } as QuestionWithAnswers;
    },
    enabled: !!id,
  });
}

/**
 * Hook to get question count for filters.
 * Lightweight query that only fetches count.
 */
export function useQuestionCount(filters: QuestionFilters) {
  return useQuery({
    queryKey: queryKeys.questions.count(filters),
    queryFn: async () => {
      // Try offline first
      if (filters.module_name) {
        const offlineData = await OfflineContentService.getModuleContent(filters.module_name);
        if (offlineData && offlineData.questions && offlineData.questions.length > 0) {
          let questions = offlineData.questions;

          if (filters.exam_type && filters.exam_type.trim() !== '') {
            questions = questions.filter((q: Record<string, unknown>) => q.exam_type === filters.exam_type);
          }
          if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
            questions = questions.filter((q: Record<string, unknown>) => q.sub_discipline === filters.sub_discipline);
          }
          if (filters.cours && filters.cours.trim() !== '') {
            const normalize = (s: string) => s.trim().toLowerCase();
            const target = normalize(filters.cours as string);
            questions = questions.filter((q: Record<string, unknown>) => 
              Array.isArray(q.cours) && (q.cours as string[]).some(c => normalize(c) === target)
            );
          }

          if (questions.length === 0 && filters.cours) {
            // Fall back to Supabase if course not found in offline data
          } else {
            return questions.length;
          }
        }
      }

      // Fallback to Supabase
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (filters.module_name && filters.module_name.trim() !== '') {
        query = query.eq('module_name', filters.module_name);
      }
      if (filters.exam_type && filters.exam_type.trim() !== '') {
        query = query.eq('exam_type', filters.exam_type);
      }
      if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
        query = query.eq('sub_discipline', filters.sub_discipline);
      }
      if (filters.cours && filters.cours.trim() !== '') {
        query = query.contains('cours', [filters.cours]);
      }

      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count || 0;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get available exam years for a module.
 */
export function useExamYears(moduleName: string, examType?: ExamType) {
  return useQuery({
    queryKey: queryKeys.questions.examYears(moduleName, examType),
    queryFn: async () => {
      // Try offline first
      const offlineData = await OfflineContentService.getModuleContent(moduleName);
      if (offlineData && offlineData.questions && offlineData.questions.length > 0) {
        let questions = offlineData.questions;
        if (examType) {
          questions = questions.filter((q: Record<string, unknown>) => q.exam_type === examType);
        }

        const yearCounts: Record<number, number> = {};
        questions.forEach((q: Record<string, unknown>) => {
          if (q.exam_year) {
            const year = q.exam_year as number;
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        });

        return Object.entries(yearCounts)
          .map(([year, count]) => ({ year: parseInt(year), count }))
          .sort((a, b) => b.year - a.year);
      }

      // Fallback to Supabase
      let query = supabase
        .from('questions')
        .select('exam_year')
        .eq('module_name', moduleName)
        .not('exam_year', 'is', null);

      if (examType) {
        query = query.eq('exam_type', examType);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const yearCounts: Record<number, number> = {};
      for (const item of data || []) {
        if (item.exam_year) {
          yearCounts[item.exam_year] = (yearCounts[item.exam_year] || 0) + 1;
        }
      }

      return Object.entries(yearCounts)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => b.year - a.year);
    },
    enabled: !!moduleName,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// ============================================================================
// Prefetch Utilities
// ============================================================================

/**
 * Prefetch questions for anticipated navigation.
 */
export function usePrefetchQuestions() {
  const queryClient = useQueryClient();

  return async (filters: QuestionFilters) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.questions.list(filters),
      queryFn: () => fetchQuestions(filters),
      staleTime: 1000 * 60 * 30,
    });
  };
}
