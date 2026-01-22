// ============================================================================
// Saved Questions Service
// ============================================================================

import { supabase } from './supabase'
import { SavedQuestion, QuestionWithAnswers } from '@/types'

// ============================================================================
// Save Question
// ============================================================================

// Helper to resolve Question ID if it's not a UUID (e.g. offline content ID)
async function resolveQuestionId(questionId: string, details?: { module_name: string; exam_type: any; exam_year?: number; number: number }): Promise<string | null> {
  // If it's already a valid UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(questionId)) {
    return questionId;
  }

  // If matched details are provided, try to find the UUID
  if (details) {
    if (__DEV__) {
      console.log('[Saved] Resolving offline ID:', questionId, details);
    }
    
    let query = supabase
      .from('questions')
      .select('id')
      .eq('module_name', details.module_name)
      .eq('number', details.number)
      .limit(1);

    if (details.exam_type) {
      query = query.eq('exam_type', details.exam_type);
    }
    if (details.exam_year) {
      query = query.eq('exam_year', details.exam_year);
    }

    const { data, error } = await query;
    
    if (data && data.length > 0) {
      if (__DEV__) {
        console.log('[Saved] Resolved to UUID:', data[0].id);
      }
      return data[0].id;
    }
    
    if (__DEV__) {
      console.warn('[Saved] Could not resolve question UUID:', error?.message);
    }
  }

  return null;
}

export async function saveQuestion(
  userId: string, 
  questionId: string, 
  details?: { module_name: string; exam_type: any; exam_year?: number; number: number }
): Promise<{ error: string | null }> {
  try {
    if (__DEV__) {
      console.log('[Saved] Attempting to save question:', { userId, questionId })
    }

    // Resolve UUID if needed
    const resolvedId = await resolveQuestionId(questionId, details);
    if (!resolvedId) {
      return { error: 'Invalid Question ID: Cannot resolve offline content to database record.' };
    }
    
    const { error } = await supabase
      .from('saved_questions')
      .insert({
        user_id: userId,
        question_id: resolvedId,
      })

    if (error) {
      // Ignore duplicate error
      if (error.code === '23505') {
        if (__DEV__) {
          console.log('[Saved] Question already saved (duplicate ignored)')
        }
        return { error: null }
      }
      
      // Foreign Key Violation (e.g., user not found in public.users)
      if (error.code === '23503') {
        if (__DEV__) {
          console.error('[Saved] FK Violation:', error.details)
        }
        return { error: 'Reference error: User or Question not found' }
      }

      // RLS Policy Violation
      if (error.code === '42501') {
         if (__DEV__) {
          console.error('[Saved] RLS Violation: Check RLS policies for saved_questions table')
        }
        return { error: 'Permission denied: Cannot save question' }
      }

      if (__DEV__) {
        console.error('[Saved] Save error:', error.message, error.code)
      }
      return { error: error.message }
    }

    if (__DEV__) {
      console.log('[Saved] Successfully saved question')
    }
    return { error: null }
  } catch (error) {
    if (__DEV__) {
      console.error('[Saved] Unexpected error:', error)
    }
    return { error: 'Failed to save question' }
  }
}

// ============================================================================
// Unsave Question
// ============================================================================

export async function unsaveQuestion(
  userId: string, 
  questionId: string, 
  details?: { module_name: string; exam_type: any; exam_year?: number; number: number }
): Promise<{ error: string | null }> {
  try {
    // Resolve UUID if needed
    const resolvedId = await resolveQuestionId(questionId, details);
    if (!resolvedId) {
      return { error: 'Invalid Question ID: Cannot resolve offline content to database record.' };
    }

    const { error } = await supabase
      .from('saved_questions')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', resolvedId)

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

export async function isQuestionSaved(
  userId: string, 
  questionId: string, 
  details?: { module_name: string; exam_type: any; exam_year?: number; number: number }
): Promise<boolean> {
  try {
    // Resolve UUID if needed
    const resolvedId = await resolveQuestionId(questionId, details);
    if (!resolvedId) return false;

    const { data, error } = await supabase
      .from('saved_questions')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', resolvedId)
      .maybeSingle()

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

export async function toggleSaveQuestion(
  userId: string, 
  questionId: string, 
  details?: { module_name: string; exam_type: any; exam_year?: number; number: number }
): Promise<{
  isSaved: boolean;
  error: string | null
}> {
  const saved = await isQuestionSaved(userId, questionId, details)

  if (saved) {
    // If it's saved, it means we have a record with this questionId (likely UUID).
    // If questionId is string, we might struggle to unsave if we stored UUID.
    // BUT isQuestionSaved query should have handled it?
    // Wait, isQuestionSaved relies on exact match.
    // If we saved UUID, but checking with "2_Appareil...", isQuestionSaved will return false.
    // This is tricky.
    
    // Attempt resolve for unsave as well?
    // If "saved" returned true, it means we found it using `questionId`.
    // If `questionId` was UUID, great.
    // If `questionId` was string, and "saved" returned true, then string ID is in DB? NO, DB is UUID.
    
    // So isQuestionSaved("2_Appareil...") will return FALSE even if question is saved (as UUID).
    // So we will try to SAVE it again.
    // saveQuestion will resolve UUID and try to insert.
    // Duplicate error 23505 will occur.
    // We catch that and return { error: null }.
    // BUT we return { isSaved: true }.
    
    // To fix Unsave:
    // We need to resolve ID in isQuestionSaved too?
    // Yes.
    
    const { error } = await unsaveQuestion(userId, questionId, details)
    return { isSaved: false, error }
  } else {
    const { error } = await saveQuestion(userId, questionId, details)
    return { isSaved: true, error }
  }
}
