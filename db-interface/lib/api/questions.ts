// API functions for questions
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { FacultySource } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type Answer = Database['public']['Tables']['answers']['Row'];
type AnswerInsert = Database['public']['Tables']['answers']['Insert'];

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export interface CreateQuestionData {
  year: string;
  module_name: string;
  sub_discipline?: string;
  exam_type: string;
  exam_year?: number;
  number: number;
  question_text: string;
  // New fields
  speciality?: string;
  cours?: string[];
  unity_name?: string;
  module_type?: string;
  faculty_source?: FacultySource;  // Source: Faculté Mère ou Annexes
  answers: {
    option_label: 'A' | 'B' | 'C' | 'D' | 'E';
    answer_text: string;
    is_correct: boolean;
    display_order: number;
  }[];
}

// Create a new question with answers
export async function createQuestion(data: CreateQuestionData) {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call API route (server-side with service role key)
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        question: {
          year: data.year,
          module_name: data.module_name,
          sub_discipline: data.sub_discipline || null,
          exam_type: data.exam_type,
          number: data.number,
          question_text: data.question_text,
          speciality: data.speciality || null,
          cours: data.cours || null,
          unity_name: data.unity_name || null,
          module_type: data.module_type,
          faculty_source: data.faculty_source || null,
        },
        answers: data.answers,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create question');
    }

    return result;
  } catch (error: any) {
    console.error('Error creating question:', error);
    return {
      success: false,
      error: error.message || 'Failed to create question',
    };
  }
}

// Get all questions with filters
export async function getQuestions(filters?: {
  year?: string;
  module_name?: string;
  sub_discipline?: string;
  exam_type?: string;
}) {
  try {
    let query = supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .order('number', { ascending: true });

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.module_name) {
      query = query.eq('module_name', filters.module_name);
    }
    if (filters?.sub_discipline) {
      query = query.eq('sub_discipline', filters.sub_discipline);
    }
    if (filters?.exam_type) {
      query = query.eq('exam_type', filters.exam_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data as QuestionWithAnswers[],
    };
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch questions',
      data: [],
    };
  }
}

// Get a single question by ID
export async function getQuestionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as QuestionWithAnswers,
    };
  } catch (error: any) {
    console.error('Error fetching question:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch question',
    };
  }
}

// Update a question
export async function updateQuestion(
  id: string,
  data: CreateQuestionData
) {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call API route (server-side with service role key)
    const response = await fetch('/api/questions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        id,
        question: {
          year: data.year,
          module_name: data.module_name,
          sub_discipline: data.sub_discipline || null,
          exam_type: data.exam_type,
          exam_year: data.exam_year || null,
          number: data.number,
          question_text: data.question_text,
          speciality: data.speciality || null,
          cours: data.cours || null,
          unity_name: data.unity_name || null,
          module_type: data.module_type,
          faculty_source: data.faculty_source || null,
        },
        answers: data.answers,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update question');
    }

    return result;
  } catch (error: any) {
    console.error('Error updating question:', error);
    return {
      success: false,
      error: error.message || 'Failed to update question',
    };
  }
}

// Delete a question (answers will be deleted automatically via CASCADE)
export async function deleteQuestion(id: string) {
  try {
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete question',
    };
  }
}

// Get question statistics
export async function getQuestionStats() {
  try {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return {
      success: true,
      data: {
        total: count || 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return {
      success: false,
      data: { total: 0 },
    };
  }
}
