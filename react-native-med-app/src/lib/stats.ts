// ============================================================================
// Statistics Service
// ============================================================================

import { supabase } from './supabase'
import { TestAttempt, UserStatistics, ModuleStatistics, ExamType, YearLevel } from '@/types'

// ============================================================================
// Save Test Attempt
// ============================================================================

export interface TestAttemptData {
  user_id: string
  year: YearLevel
  module_name: string
  sub_discipline?: string
  exam_type: ExamType
  total_questions: number
  correct_answers: number
  score_percentage: number
  time_spent_seconds?: number
}

export async function saveTestAttempt(data: TestAttemptData): Promise<{ 
  attempt: TestAttempt | null; 
  error: string | null 
}> {
  try {
    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .insert(data)
      .select()
      .single()

    if (error) {
      return { attempt: null, error: error.message }
    }

    return { attempt: attempt as TestAttempt, error: null }
  } catch (error) {
    return { attempt: null, error: 'Failed to save test attempt' }
  }
}

// ============================================================================
// Get Test History
// ============================================================================

export async function getTestHistory(
  userId: string, 
  limit: number = 20
): Promise<{ attempts: TestAttempt[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { attempts: [], error: error.message }
    }

    return { attempts: data as TestAttempt[], error: null }
  } catch (error) {
    return { attempts: [], error: 'Failed to fetch test history' }
  }
}

// ============================================================================
// Get User Statistics
// ============================================================================

export async function getUserStatistics(userId: string): Promise<{ 
  stats: UserStatistics | null; 
  error: string | null 
}> {
  try {
    // Get test attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)

    if (attemptsError) {
      return { stats: null, error: attemptsError.message }
    }

    // Get saved questions count
    const { count: savedCount, error: savedError } = await supabase
      .from('saved_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (savedError) {
      return { stats: null, error: savedError.message }
    }

    // Calculate statistics
    const attemptsData = attempts || []
    const totalQuestions = attemptsData.reduce((sum, a) => sum + a.total_questions, 0)
    const totalCorrect = attemptsData.reduce((sum, a) => sum + a.correct_answers, 0)
    const totalTime = attemptsData.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0)
    const uniqueModules = new Set(attemptsData.map(a => a.module_name)).size
    
    const lastAttempt = attemptsData.length > 0 
      ? attemptsData.sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0]
      : null

    const stats: UserStatistics = {
      total_questions_attempted: totalQuestions,
      total_correct_answers: totalCorrect,
      average_score: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      total_time_spent_minutes: Math.round(totalTime / 60),
      saved_questions_count: savedCount || 0,
      test_attempts_count: attemptsData.length,
      modules_practiced: uniqueModules,
      last_practice_date: lastAttempt?.completed_at || null,
    }

    return { stats, error: null }
  } catch (error) {
    return { stats: null, error: 'Failed to fetch user statistics' }
  }
}

// ============================================================================
// Get Module Statistics
// ============================================================================

export async function getModuleStatistics(
  userId: string, 
  moduleName: string
): Promise<{ stats: ModuleStatistics | null; error: string | null }> {
  try {
    // Get test attempts for this module
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('module_name', moduleName)

    if (attemptsError) {
      return { stats: null, error: attemptsError.message }
    }

    // Get total questions in module
    const { count: totalQuestions, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('module_name', moduleName)

    if (countError) {
      return { stats: null, error: countError.message }
    }

    // Calculate statistics
    const attemptsData = attempts || []
    const questionsAttempted = attemptsData.reduce((sum, a) => sum + a.total_questions, 0)
    const correctAnswers = attemptsData.reduce((sum, a) => sum + a.correct_answers, 0)

    const stats: ModuleStatistics = {
      module_name: moduleName,
      total_questions: totalQuestions || 0,
      questions_attempted: questionsAttempted,
      correct_answers: correctAnswers,
      average_score: questionsAttempted > 0 ? (correctAnswers / questionsAttempted) * 100 : 0,
      attempts_count: attemptsData.length,
    }

    return { stats, error: null }
  } catch (error) {
    return { stats: null, error: 'Failed to fetch module statistics' }
  }
}

// ============================================================================
// Get All Module Statistics
// ============================================================================

export async function getAllModuleStatistics(userId: string): Promise<{ 
  stats: ModuleStatistics[]; 
  error: string | null 
}> {
  try {
    // Get all test attempts grouped by module
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select('module_name, total_questions, correct_answers')
      .eq('user_id', userId)

    if (attemptsError) {
      return { stats: [], error: attemptsError.message }
    }

    // Group by module
    const moduleMap = new Map<string, { 
      questions: number; 
      correct: number; 
      attempts: number 
    }>()

    for (const attempt of attempts || []) {
      const existing = moduleMap.get(attempt.module_name) || { 
        questions: 0, 
        correct: 0, 
        attempts: 0 
      }
      moduleMap.set(attempt.module_name, {
        questions: existing.questions + attempt.total_questions,
        correct: existing.correct + attempt.correct_answers,
        attempts: existing.attempts + 1,
      })
    }

    // Convert to array
    const stats: ModuleStatistics[] = Array.from(moduleMap.entries()).map(([name, data]) => ({
      module_name: name,
      total_questions: 0, // Would need separate query
      questions_attempted: data.questions,
      correct_answers: data.correct,
      average_score: data.questions > 0 ? (data.correct / data.questions) * 100 : 0,
      attempts_count: data.attempts,
    }))

    return { stats, error: null }
  } catch (error) {
    return { stats: [], error: 'Failed to fetch module statistics' }
  }
}
