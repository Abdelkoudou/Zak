// ============================================================================
// Question Reports Service
// ============================================================================

import { supabase } from './supabase'

export type ReportType = 
  | 'error_in_question'   // Erreur dans la question
  | 'wrong_answer'        // Réponse incorrecte
  | 'unclear'             // Question pas claire
  | 'duplicate'           // Question dupliquée
  | 'outdated'            // Information obsolète
  | 'other'               // Autre

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  error_in_question: 'Erreur dans la question',
  wrong_answer: 'Réponse incorrecte',
  unclear: 'Question pas claire',
  duplicate: 'Question dupliquée',
  outdated: 'Information obsolète',
  other: 'Autre',
}

export interface QuestionReport {
  id: string
  question_id: string
  user_id: string
  report_type: ReportType
  description?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
}

// ============================================================================
// Submit a Question Report
// ============================================================================

export async function submitQuestionReport(
  userId: string,
  questionId: string,
  reportType: ReportType,
  description?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('question_reports')
      .insert({
        user_id: userId,
        question_id: questionId,
        report_type: reportType,
        description: description?.trim() || null,
      })

    if (error) {
      // Handle duplicate report error
      if (error.code === '23505') {
        return { success: false, error: 'Vous avez déjà signalé cette question' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: 'Erreur lors de l\'envoi du signalement' }
  }
}

// ============================================================================
// Check if User Already Reported a Question
// ============================================================================

export async function hasUserReportedQuestion(
  userId: string,
  questionId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('status', 'pending')
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
// Get User's Reports
// ============================================================================

export async function getUserReports(userId: string): Promise<{
  reports: QuestionReport[]
  error: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { reports: [], error: error.message }
    }

    return { reports: data as QuestionReport[], error: null }
  } catch (error) {
    return { reports: [], error: 'Erreur lors de la récupération des signalements' }
  }
}
