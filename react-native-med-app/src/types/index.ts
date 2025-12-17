// ============================================================================
// MCQ Study App - TypeScript Types
// ============================================================================

// Enums
export type YearLevel = '1' | '2' | '3'
export type ModuleType = 'annual' | 'semestrial' | 'uei' | 'standalone'
export type ExamType = 'EMD' | 'EMD1' | 'EMD2' | 'Rattrapage' 
export type UserRole = 'owner' | 'admin' | 'manager' | 'student'
export type ResourceType = 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other'
export type Speciality = 'Médecine' | 'Pharmacie' | 'Dentaire'
export type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E'

// User
export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_paid: boolean
  subscription_expires_at: string | null
  speciality: Speciality | null
  year_of_study: YearLevel | null
  region: string | null
  created_at: string
  updated_at: string
}

// Module
export interface SubDiscipline {
  name: string
  examTypes: ExamType[]
}

export interface Module {
  id: string
  name: string
  year: YearLevel
  type: ModuleType
  exam_types: ExamType[]
  has_sub_disciplines: boolean
  sub_disciplines: SubDiscipline[] | null
  created_at: string
  updated_at: string
}

// Question
export interface Question {
  id: string
  year: YearLevel
  module_name: string
  sub_discipline: string | null
  exam_type: ExamType
  number: number
  question_text: string
  speciality: Speciality | null
  cours: string[] | null
  unity_name: string | null
  module_type: ModuleType | null
  created_at: string
  updated_at: string
}

// Answer
export interface Answer {
  id: string
  question_id: string
  option_label: OptionLabel
  answer_text: string
  is_correct: boolean
  display_order: number
  created_at: string
}

// Question with answers
export interface QuestionWithAnswers extends Question {
  answers: Answer[]
}

// Course Resource
export interface CourseResource {
  id: string
  year: YearLevel
  module_name: string
  sub_discipline: string | null
  title: string
  type: ResourceType
  url: string
  description: string | null
  created_at: string
  updated_at: string
}

// Saved Question
export interface SavedQuestion {
  id: string
  user_id: string
  question_id: string
  created_at: string
}

// Test Attempt
export interface TestAttempt {
  id: string
  user_id: string
  year: YearLevel
  module_name: string
  sub_discipline: string | null
  exam_type: ExamType
  total_questions: number
  correct_answers: number
  score_percentage: number
  time_spent_seconds: number | null
  completed_at: string
}

// Activation Key
export interface ActivationKey {
  id: string
  key_code: string
  duration_days: number
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_by: string | null
  created_at: string
}

// Device Session
export interface DeviceSession {
  id: string
  user_id: string
  device_id: string
  device_name: string | null
  last_active_at: string
  created_at: string
}

// ============================================================================
// Form Types
// ============================================================================

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  speciality: Speciality
  year_of_study: YearLevel
  region: string
  activation_code: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ProfileUpdateData {
  full_name?: string
  speciality?: Speciality
  year_of_study?: YearLevel
  region?: string
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface UserStatistics {
  total_questions_attempted: number
  total_correct_answers: number
  average_score: number
  total_time_spent_minutes: number
  saved_questions_count: number
  test_attempts_count: number
  modules_practiced: number
  last_practice_date: string | null
}

export interface ModuleStatistics {
  module_name: string
  total_questions: number
  questions_attempted: number
  correct_answers: number
  average_score: number
  attempts_count: number
}

// ============================================================================
// Practice Types
// ============================================================================

export interface PracticeSession {
  module: Module
  exam_type?: ExamType
  sub_discipline?: string
  cours?: string
  questions: QuestionWithAnswers[]
  currentIndex: number
  answers: Record<string, OptionLabel[]>
  startTime: Date
}

export interface PracticeResult {
  total_questions: number
  correct_answers: number
  score_percentage: number
  time_spent_seconds: number
  answers: {
    question_id: string
    selected: OptionLabel[]
    correct: OptionLabel[]
    is_correct: boolean
  }[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ActivationResponse {
  success: boolean
  message: string
  expires_at?: string
}

export interface ApiError {
  message: string
  code?: string
}
