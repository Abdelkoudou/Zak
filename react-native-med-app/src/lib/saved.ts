// ============================================================================
// Saved Questions Service
// ============================================================================

import { supabase } from './supabase'
import { SavedQuestion, QuestionWithAnswers } from '@/types'

// ============================================================================
// Save Question
// ============================================================================

export async function saveQuestion(userId: string, questionId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('saved_questions')
      .insert({
        user_id: userId,
        question_id: questionId,
      })

    if (error) {
      // Ignore duplicate error
      if (error.code === '23505') {
        return { error: null }
      }
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return { error: 'Failed to save question' }
  }
}

// ============================================================================
// Unsave Question
// ============================================================================

export async function unsaveQuestion(userId: string, questionId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('saved_questions')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return { error: 'Failed to unsave question' }
  }
}

// ============================================================================
// Check if Question is Saved
// ============================================================================

export async function isQuestionSaved(userId: string, questionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('saved_questions')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (error || !data) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

// ============================================================================
// Get Saved Question IDs
// ============================================================================

export async function getSavedQuestionIds(userId: string): Promise<{ ids: string[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('saved_questions')
      .select('question_id')
      .eq('user_id', userId)

    if (error) {
      return { ids: [], error: error.message }
    }

    return { ids: (data || []).map(s => s.question_id), error: null }
  } catch (error) {
    return { ids: [], error: 'Failed to fetch saved questions' }
  }
}

// ============================================================================
// Get Saved Questions with Details
// ============================================================================

export async function getSavedQuestions(userId: string, moduleName?: string): Promise<{ 
  questions: QuestionWithAnswers[]; 
  error: string | null 
}> {
  try {
    // Get saved question IDs
    let query = supabase
      .from('saved_questions')
      .select('question_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const { data: savedData, error: savedError } = await query

    if (savedError) {
      return { questions: [], error: savedError.message }
    }

    if (!savedData || savedData.length === 0) {
      return { questions: [], error: null }
    }

    const questionIds = savedData.map(s => s.question_id)

    // Fetch questions with answers
    let questionsQuery = supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .in('id', questionIds)

    if (moduleName) {
      questionsQuery = questionsQuery.eq('module_name', moduleName)
    }

    const { data: questionsData, error: questionsError } = await questionsQuery

    if (questionsError) {
      return { questions: [], error: questionsError.message }
    }

    // Sort answers
    const questionsWithSortedAnswers = (questionsData || []).map(q => ({
      ...q,
      answers: (q.answers || []).sort((a: any, b: any) => a.display_order - b.display_order)
    }))

    return { questions: questionsWithSortedAnswers as QuestionWithAnswers[], error: null }
  } catch (error) {
    return { questions: [], error: 'Failed to fetch saved questions' }
  }
}

// ============================================================================
// Get Saved Questions Count
// ============================================================================

export async function getSavedQuestionsCount(userId: string): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('saved_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error: 'Failed to fetch saved questions count' }
  }
}

// ============================================================================
// Toggle Save Question
// ============================================================================

export async function toggleSaveQuestion(userId: string, questionId: string): Promise<{ 
  isSaved: boolean; 
  error: string | null 
}> {
  const saved = await isQuestionSaved(userId, questionId)
  
  if (saved) {
    const { error } = await unsaveQuestion(userId, questionId)
    return { isSaved: false, error }
  } else {
    const { error } = await saveQuestion(userId, questionId)
    return { isSaved: true, error }
  }
}
