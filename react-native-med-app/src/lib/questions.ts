// ============================================================================
// Questions Service
// ============================================================================

import { supabase } from './supabase'
import { Question, QuestionWithAnswers, ExamType, YearLevel } from '@/types'
import { OfflineContentService } from './offline-content'

// ============================================================================
// Get Questions with Answers
// ============================================================================

export interface QuestionFilters {
  module_name?: string
  exam_type?: ExamType
  sub_discipline?: string
  cours?: string
  year?: YearLevel
  exam_year?: number
  limit?: number
  offset?: number
}

// Helper for exam type sorting (EMD < Rattrapage < Residanat)
export const getExamTypeWeight = (type: string | undefined | null) => {
  if (!type) return 99
  const t = type.toLowerCase()
  if (t.includes('emd')) return 1
  if (t.includes('rattrapage')) return 2
  if (t.includes('residanat')) return 3
  return 10
}

export async function getQuestions(filters: QuestionFilters): Promise<{
  questions: QuestionWithAnswers[];
  total: number;
  error: string | null
}> {
  try {
    // Check offline content first
    if (filters.module_name) {
      const year = filters.year ? parseInt(filters.year) : undefined;
      const offlineData = await OfflineContentService.getModuleContent(filters.module_name, year)
      if (offlineData) {
        // Map offline questions to expected format
        let questions = offlineData.questions.map((q: any) => ({
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
          // Map answers from offline format (label/text) to app format (option_label/answer_text)
          answers: (q.answers || []).map((a: any) => ({
            id: a.id || `${q.id}_${a.label || a.option_label}`,
            question_id: q.id,
            option_label: a.label || a.option_label,
            answer_text: a.text || a.answer_text,
            is_correct: a.is_correct,
            display_order: a.display_order,
          }))
        })) as QuestionWithAnswers[];

        // Apply filters in memory
        if (filters.exam_type && filters.exam_type.trim() !== '') {
          questions = questions.filter(q => q.exam_type === filters.exam_type)
        }
        if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
          questions = questions.filter(q => q.sub_discipline === filters.sub_discipline)
        }
        if (filters.cours && filters.cours.trim() !== '') {
          const normalize = (s: string) => s.trim().toLowerCase();
          const target = normalize(filters.cours as string);
          questions = questions.filter(q => q.cours && q.cours.some(c => normalize(c) === target))
        }
        if (filters.exam_year) {
          questions = questions.filter(q => q.exam_year === filters.exam_year)
        }

        // Sort questions chronologically: Year (Latest First) -> Session (EMD < Rattrapage) -> Number
        questions = [...questions].sort((a, b) => {
          // 1. Year (Descending: Latest First)
          const yearA = a.exam_year || 0
          const yearB = b.exam_year || 0
          if (yearA !== yearB) return yearB - yearA

          // 2. Exam Type (Session)
          const typeA = getExamTypeWeight(a.exam_type)
          const typeB = getExamTypeWeight(b.exam_type)
          if (typeA !== typeB) return typeA - typeB

          // 3. Number (Ascending)
          return (a.number || 0) - (b.number || 0)
        })

        // Pagination
        const total = questions.length
        if (filters.offset !== undefined && filters.limit !== undefined) {
          questions = questions.slice(filters.offset, filters.offset + filters.limit)
        } else if (filters.limit) {
          questions = questions.slice(0, filters.limit)
        }

        if (questions.length === 0 && filters.cours) {
          // If course not found in offline data, fall back to Supabase
        } else {
          return { questions, total, error: null }
        }
      }
    }

    let query = supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.module_name && filters.module_name.trim() !== '') {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.exam_type && filters.exam_type.trim() !== '') {
      query = query.eq('exam_type', filters.exam_type)
    }
    if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
      query = query.eq('sub_discipline', filters.sub_discipline)
    }
    if (filters.cours && filters.cours.trim() !== '') {
      // Use .filter() with proper PostgreSQL array literal syntax
      // Elements containing commas need double-quoting, and internal quotes/backslashes need escaping
      const escapedCours = filters.cours
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      query = query.filter('cours', 'cs', `{"${escapedCours}"}`)
    }
    if (filters.year && filters.year.trim() !== '') {
      query = query.eq('year', filters.year)
    }
    if (filters.exam_year) {
      query = query.eq('exam_year', filters.exam_year)
    }

    // Sort by: Year (Latest First) -> Exam Type -> Number
    // Adding exam_type to SQL sort ensures consistent pagination
    // Alphabetically: EMD < Rattrapage < Residanat
    query = query.order('exam_year', { ascending: false })
    query = query.order('exam_type', { ascending: true })
    query = query.order('number', { ascending: true })

    // Pagination
    if (filters.offset !== undefined) {
      const limit = filters.limit || 20
      query = query.range(filters.offset, filters.offset + limit - 1)
    } else if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, count, error } = await query

    if (error) {
      return { questions: [], total: 0, error: error.message }
    }



    // Sort answers by display_order
    let questionsWithSortedAnswers = (data || []).map(q => ({
      ...q,
      answers: (q.answers || []).sort((a: any, b: any) => a.display_order - b.display_order)
    }))

    // Apply chronological sort to the fetched page
    // Note: If pagination is used, this only sorts the current page. 
    // Since SQL already sorted by year+number, this is mostly fine, just refining exam_type order if mixed.
    questionsWithSortedAnswers = [...questionsWithSortedAnswers].sort((a, b) => {
      // 1. Year (Descending: Latest First) - should match SQL
      const yearA = a.exam_year || 0
      const yearB = b.exam_year || 0
      if (yearA !== yearB) return yearB - yearA

      // 2. Exam Type (Session)
      const typeA = getExamTypeWeight(a.exam_type)
      const typeB = getExamTypeWeight(b.exam_type)
      if (typeA !== typeB) return typeA - typeB

      // 3. Number (Ascending)
      return (a.number || 0) - (b.number || 0)
    })

    return {
      questions: questionsWithSortedAnswers as QuestionWithAnswers[],
      total: count || 0,
      error: null
    }
  } catch (error) {
    return { questions: [], total: 0, error: 'Failed to fetch questions' }
  }
}

// ============================================================================
// Get Questions by Exam Type
// ============================================================================

export async function getQuestionsByExam(
  moduleName: string,
  examType: ExamType,
  subDiscipline?: string
): Promise<{ questions: QuestionWithAnswers[]; error: string | null }> {
  const filters: QuestionFilters = {
    module_name: moduleName,
    exam_type: examType,
  }

  if (subDiscipline) {
    filters.sub_discipline = subDiscipline
  }

  const { questions, error } = await getQuestions(filters)
  return { questions, error }
}

// ============================================================================
// Get Questions by Cours
// ============================================================================

export async function getQuestionsByCours(
  moduleName: string,
  cours: string
): Promise<{ questions: QuestionWithAnswers[]; error: string | null }> {
  const { questions, error } = await getQuestions({
    module_name: moduleName,
    cours: cours,
  })
  return { questions, error }
}

// ============================================================================
// Get Random Questions
// ============================================================================

export async function getRandomQuestions(
  moduleName: string,
  count: number = 10
): Promise<{ questions: QuestionWithAnswers[]; error: string | null }> {
  try {
    // Try offline content first
    const offlineData = await OfflineContentService.getModuleContent(moduleName)
    if (offlineData && offlineData.questions.length > 0) {
      // Map and shuffle offline questions
      const allQuestions = offlineData.questions.map((q: any) => ({
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
        answers: (q.answers || []).map((a: any) => ({
          id: a.id || `${q.id}_${a.label || a.option_label}`,
          question_id: q.id,
          option_label: a.label || a.option_label,
          answer_text: a.text || a.answer_text,
          is_correct: a.is_correct,
          display_order: a.display_order,
        }))
      })) as QuestionWithAnswers[];

      // Shuffle and take random questions
      const shuffled = allQuestions.sort(() => Math.random() - 0.5)
      return { questions: shuffled.slice(0, count), error: null }
    }

    // Fallback to online
    // First get all question IDs for the module
    const { data: questionIds, error: idsError } = await supabase
      .from('questions')
      .select('id')
      .eq('module_name', moduleName)

    if (idsError) {
      return { questions: [], error: idsError.message }
    }

    if (!questionIds || questionIds.length === 0) {
      return { questions: [], error: null }
    }

    // Shuffle and take random IDs
    const shuffled = questionIds.sort(() => Math.random() - 0.5)
    const selectedIds = shuffled.slice(0, count).map(q => q.id)

    // Fetch full questions with answers
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .in('id', selectedIds)

    if (error) {
      return { questions: [], error: error.message }
    }

    // Sort answers and shuffle questions
    const questionsWithSortedAnswers = (data || [])
      .map(q => ({
        ...q,
        answers: (q.answers || []).sort((a: any, b: any) => a.display_order - b.display_order)
      }))
      .sort(() => Math.random() - 0.5)

    return { questions: questionsWithSortedAnswers as QuestionWithAnswers[], error: null }
  } catch (error) {
    return { questions: [], error: 'Failed to fetch random questions' }
  }
}

// ============================================================================
// Get Question by ID
// ============================================================================

export async function getQuestionById(id: string): Promise<{
  question: QuestionWithAnswers | null;
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return { question: null, error: error.message }
    }

    // Sort answers
    const questionWithSortedAnswers = {
      ...data,
      answers: (data.answers || []).sort((a: any, b: any) => a.display_order - b.display_order)
    }

    return { question: questionWithSortedAnswers as QuestionWithAnswers, error: null }
  } catch (error) {
    return { question: null, error: 'Failed to fetch question' }
  }
}

// ============================================================================
// Get Question Count
// ============================================================================

export async function getQuestionCount(filters: QuestionFilters): Promise<{
  count: number;
  error: string | null
}> {
  try {
    // Try offline content first
    if (filters.module_name) {
      const offlineData = await OfflineContentService.getModuleContent(filters.module_name);
      if (offlineData && offlineData.questions && offlineData.questions.length > 0) {
        // Apply filters in memory
        let questions = offlineData.questions;

        if (filters.exam_type && filters.exam_type.trim() !== '') {
          questions = questions.filter((q: any) => q.exam_type === filters.exam_type);
        }
        if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
          questions = questions.filter((q: any) => q.sub_discipline === filters.sub_discipline);
        }
        if (filters.cours && filters.cours.trim() !== '') {
          const normalize = (s: string) => s.trim().toLowerCase();
          const target = normalize(filters.cours as string);
          questions = questions.filter((q: any) => q.cours && q.cours.some((c: string) => normalize(c) === target));
        }
        if (filters.exam_year) {
          questions = questions.filter((q: any) => q.exam_year === filters.exam_year);
        }

        if (questions.length === 0 && filters.cours) {
          // If course not found in offline data, fall back to Supabase
        } else {
          return { count: questions.length, error: null };
        }
      }
    }

    // Fallback to Supabase
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    if (filters.module_name && filters.module_name.trim() !== '') {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.exam_type && filters.exam_type.trim() !== '') {
      query = query.eq('exam_type', filters.exam_type)
    }
    if (filters.sub_discipline && filters.sub_discipline.trim() !== '') {
      query = query.eq('sub_discipline', filters.sub_discipline)
    }
    if (filters.cours && filters.cours.trim() !== '') {
      // Use .filter() with proper PostgreSQL array literal syntax for comma-containing values
      const escapedCours = filters.cours
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      query = query.filter('cours', 'cs', `{"${escapedCours}"}`)
    }
    if (filters.exam_year) {
      query = query.eq('exam_year', filters.exam_year)
    }

    const { count, error } = await query

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error: 'Failed to fetch question count' }
  }
}

// ============================================================================
// Get Available Exam Years for a Module/Exam Type
// ============================================================================

export async function getExamYears(
  moduleName: string,
  examType?: ExamType
): Promise<{ years: { year: number; count: number }[]; error: string | null }> {
  try {
    // Try offline content first
    const offlineData = await OfflineContentService.getModuleContent(moduleName);
    if (offlineData && offlineData.questions && offlineData.questions.length > 0) {
      // Filter by exam type if specified and count by exam_year
      let questions = offlineData.questions;
      if (examType) {
        questions = questions.filter((q: any) => q.exam_type === examType);
      }

      const yearCounts: Record<number, number> = {};
      questions.forEach((q: any) => {
        if (q.exam_year) {
          yearCounts[q.exam_year] = (yearCounts[q.exam_year] || 0) + 1;
        }
      });

      const years = Object.entries(yearCounts)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => b.year - a.year); // newest first

      return { years, error: null };
    }

    // Fallback to Supabase
    let query = supabase
      .from('questions')
      .select('exam_year')
      .eq('module_name', moduleName)
      .not('exam_year', 'is', null)

    if (examType) {
      query = query.eq('exam_type', examType)
    }

    const { data, error } = await query

    if (error) {
      return { years: [], error: error.message }
    }

    // Count occurrences of each year
    const yearCounts: Record<number, number> = {}
    for (const item of data || []) {
      if (item.exam_year) {
        yearCounts[item.exam_year] = (yearCounts[item.exam_year] || 0) + 1
      }
    }

    // Convert to array and sort descending (newest first)
    const years = Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year)

    return { years, error: null }
  } catch (error) {
    return { years: [], error: 'Failed to fetch exam years' }
  }
}
