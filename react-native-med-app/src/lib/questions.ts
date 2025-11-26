// ============================================================================
// Questions Service
// ============================================================================

import { supabase } from './supabase'
import { Question, QuestionWithAnswers, ExamType, YearLevel } from '@/types'

// ============================================================================
// Get Questions with Answers
// ============================================================================

export interface QuestionFilters {
  module_name?: string
  exam_type?: ExamType
  sub_discipline?: string
  cours?: string
  year?: YearLevel
  limit?: number
  offset?: number
}

export async function getQuestions(filters: QuestionFilters): Promise<{ 
  questions: QuestionWithAnswers[]; 
  total: number;
  error: string | null 
}> {
  try {
    let query = supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.exam_type) {
      query = query.eq('exam_type', filters.exam_type)
    }
    if (filters.sub_discipline) {
      query = query.eq('sub_discipline', filters.sub_discipline)
    }
    if (filters.cours) {
      query = query.contains('cours', [filters.cours])
    }
    if (filters.year) {
      query = query.eq('year', filters.year)
    }

    // Order by number
    query = query.order('number', { ascending: true })

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, count, error } = await query

    if (error) {
      return { questions: [], total: 0, error: error.message }
    }

    // Sort answers by display_order
    const questionsWithSortedAnswers = (data || []).map(q => ({
      ...q,
      answers: (q.answers || []).sort((a: any, b: any) => a.display_order - b.display_order)
    }))

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
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.exam_type) {
      query = query.eq('exam_type', filters.exam_type)
    }
    if (filters.sub_discipline) {
      query = query.eq('sub_discipline', filters.sub_discipline)
    }
    if (filters.cours) {
      query = query.contains('cours', [filters.cours])
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
