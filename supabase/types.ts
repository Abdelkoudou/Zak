// ============================================================================
// Supabase Database Types
// ============================================================================
// Auto-generated types matching the Supabase schema
// Use these types in your React Native app for type safety
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
// ============================================================================

export type YearLevel = '1' | '2' | '3'

export type ModuleType = 'annual' | 'semestrial' | 'uei' | 'standalone'

export type ExamType = 
  | 'EMD' 
  | 'EMD1' 
  | 'EMD2' 
  | 'Rattrapage'
  | 'M1' 
  | 'M2' 
  | 'M3' 
  | 'M4'

export type UserRole = 'owner' | 'admin' | 'manager' | 'student'

export type ResourceType = 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type Speciality = 'Médecine' | 'Pharmacie' | 'Dentaire'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          is_paid?: boolean
          subscription_expires_at?: string | null
          speciality?: Speciality | null
          year_of_study?: YearLevel | null
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          is_paid?: boolean
          subscription_expires_at?: string | null
          speciality?: Speciality | null
          year_of_study?: YearLevel | null
          region?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          year: YearLevel
          type: ModuleType
          exam_types: ExamType[]
          has_sub_disciplines?: boolean
          sub_disciplines?: SubDiscipline[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          year?: YearLevel
          type?: ModuleType
          exam_types?: ExamType[]
          has_sub_disciplines?: boolean
          sub_disciplines?: SubDiscipline[] | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          year: YearLevel
          module_name: string
          sub_discipline: string | null
          exam_type: ExamType
          number: number
          question_text: string
          explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: YearLevel
          module_name: string
          sub_discipline?: string | null
          exam_type: ExamType
          number: number
          question_text: string
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: YearLevel
          module_name?: string
          sub_discipline?: string | null
          exam_type?: ExamType
          number?: number
          question_text?: string
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          option_label: 'A' | 'B' | 'C' | 'D' | 'E'
          answer_text: string
          is_correct: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_label: 'A' | 'B' | 'C' | 'D' | 'E'
          answer_text: string
          is_correct?: boolean
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_label?: 'A' | 'B' | 'C' | 'D' | 'E'
          answer_text?: string
          is_correct?: boolean
          display_order?: number
          created_at?: string
        }
      }
      course_resources: {
        Row: {
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
        Insert: {
          id?: string
          year: YearLevel
          module_name: string
          sub_discipline?: string | null
          title: string
          type: ResourceType
          url: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: YearLevel
          module_name?: string
          sub_discipline?: string | null
          title?: string
          type?: ResourceType
          url?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activation_keys: {
        Row: {
          id: string
          key_code: string
          duration_days: number
          is_used: boolean
          used_by: string | null
          used_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key_code: string
          duration_days?: number
          is_used?: boolean
          used_by?: string | null
          used_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          key_code?: string
          duration_days?: number
          is_used?: boolean
          used_by?: string | null
          used_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      device_sessions: {
        Row: {
          id: string
          user_id: string
          device_id: string
          device_name: string | null
          last_active_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          device_name?: string | null
          last_active_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          device_name?: string | null
          last_active_at?: string
          created_at?: string
        }
      }
      saved_questions: {
        Row: {
          id: string
          user_id: string
          question_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          created_at?: string
        }
      }
      test_attempts: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          year: YearLevel
          module_name: string
          sub_discipline?: string | null
          exam_type: ExamType
          total_questions: number
          correct_answers: number
          score_percentage: number
          time_spent_seconds?: number | null
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: YearLevel
          module_name?: string
          sub_discipline?: string | null
          exam_type?: ExamType
          total_questions?: number
          correct_answers?: number
          score_percentage?: number
          time_spent_seconds?: number | null
          completed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_subscription: {
        Args: {
          p_user_id: string
          p_key_code: string
        }
        Returns: Json
      }
      has_active_subscription: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_higher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager_or_higher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_paid_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      year_level: YearLevel
      module_type: ModuleType
      exam_type: ExamType
      user_role: UserRole
      resource_type: ResourceType
    }
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SubDiscipline {
  name: string
  examTypes: ExamType[]
}

export interface QuestionWithAnswers extends Database['public']['Tables']['questions']['Row'] {
  answers: Database['public']['Tables']['answers']['Row'][]
}

export interface ModuleWithDetails extends Database['public']['Tables']['modules']['Row'] {
  question_count?: number
  resource_count?: number
}

export interface UserProfile extends Database['public']['Tables']['users']['Row'] {
  saved_questions_count?: number
  test_attempts_count?: number
  active_devices_count?: number
}

export interface TestResult extends Database['public']['Tables']['test_attempts']['Row'] {
  module?: Database['public']['Tables']['modules']['Row']
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ActivationResponse {
  success: boolean
  message: string
  expires_at?: string
}

export interface AuthResponse {
  user: Database['public']['Tables']['users']['Row']
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface QuestionFilters {
  year?: YearLevel
  module_name?: string
  sub_discipline?: string
  exam_type?: ExamType
  search?: string
}

export interface ResourceFilters {
  year?: YearLevel
  module_name?: string
  sub_discipline?: string
  type?: ResourceType
}

export interface TestAttemptFilters {
  year?: YearLevel
  module_name?: string
  exam_type?: ExamType
  date_from?: string
  date_to?: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface QuestionFormData {
  year: YearLevel
  module_name: string
  sub_discipline?: string
  exam_type: ExamType
  number: number
  question_text: string
  explanation?: string
  answers: {
    option_label: 'A' | 'B' | 'C' | 'D' | 'E'
    answer_text: string
    is_correct: boolean
  }[]
}

export interface ResourceFormData {
  year: YearLevel
  module_name: string
  sub_discipline?: string
  title: string
  type: ResourceType
  url: string
  description?: string
}

export interface UserUpdateData {
  full_name?: string
  email?: string
}

// ============================================================================
// STATISTICS TYPES
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
  total_resources: number
  average_score: number | null
  attempts_count: number
}

export interface SystemStatistics {
  total_users: number
  paid_users: number
  total_questions: number
  total_resources: number
  total_test_attempts: number
  active_users_today: number
  active_users_week: number
  active_users_month: number
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type { Database as SupabaseDatabase }
