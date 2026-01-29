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
  exam_year: number;  // Required - promo year
  number: number;
  question_text: string;
  // New fields
  speciality?: string;
  cours?: string[];
  unity_name?: string;
  module_type?: string;
  faculty_source?: FacultySource;  // Source: Faculté Mère ou Annexes
  image_url?: string;  // URL to uploaded image
  explanation?: string;  // Optional explanation for the answer
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
          exam_year: data.exam_year,  // Required - no fallback to null
          number: data.number,
          question_text: data.question_text,
          speciality: data.speciality || null,
          cours: data.cours || null,
          unity_name: data.unity_name || null,
          module_type: data.module_type || null,
          faculty_source: data.faculty_source || null,
          image_url: data.image_url || null,
          explanation: data.explanation || null,
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

// Get all questions with filters (handles pagination to bypass 1000 row limit)
export async function getQuestions(filters?: {
  year?: string;
  module_name?: string;
  sub_discipline?: string;
  exam_type?: string;
  exam_year?: number;
  cours?: string;
}) {
  try {
    const PAGE_SIZE = 1000;
    let allData: QuestionWithAnswers[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .order('created_at', { ascending: true })
        .order('number', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters?.year && filters.year.trim() !== '') {
        query = query.eq('year', filters.year);
      }
      if (filters?.module_name && filters.module_name.trim() !== '') {
        query = query.eq('module_name', filters.module_name);
      }
      if (filters?.sub_discipline && filters.sub_discipline.trim() !== '') {
        query = query.eq('sub_discipline', filters.sub_discipline);
      }
      if (filters?.exam_type && filters.exam_type.trim() !== '') {
        query = query.eq('exam_type', filters.exam_type);
      }
      if (filters?.exam_year) {
        query = query.eq('exam_year', filters.exam_year);
      }
      if (filters?.cours && filters.cours.trim() !== '') {
        // Special handling for commas in course names for PostgREST containment filters
        const escapedCours = filters.cours.includes(',') && !filters.cours.startsWith('"') 
          ? `"${filters.cours}"` 
          : filters.cours;
        query = query.contains('cours', [escapedCours]);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...(data as QuestionWithAnswers[])];
        // If we got less than PAGE_SIZE, we've reached the end
        hasMore = data.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    return {
      success: true,
      data: allData,
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
          exam_year: data.exam_year,  // Required - no fallback to null
          number: data.number,
          question_text: data.question_text,
          speciality: data.speciality || null,
          cours: data.cours || null,
          unity_name: data.unity_name || null,
          module_type: data.module_type || null,
          faculty_source: data.faculty_source || null,
          image_url: data.image_url || null,
          explanation: data.explanation || null,
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

// Get existing question numbers and suggest next available for a specific module/exam combination
export async function getExistingQuestionNumbers(params: {
  year: string;
  module_name: string;
  sub_discipline?: string;
  exam_type: string;
  exam_year?: number;
}): Promise<{
  success: boolean;
  error?: string;
  data: {
    existingNumbers: number[];
    suggestedNext: number;
    count: number;
  };
}> {
  try {
    // Build query to find all question numbers for this combination
    let query = supabase
      .from('questions')
      .select('number')
      .eq('year', params.year)
      .eq('module_name', params.module_name)
      .eq('exam_type', params.exam_type)
      .order('number', { ascending: true });

    // Handle sub_discipline (can be null)
    if (params.sub_discipline) {
      query = query.eq('sub_discipline', params.sub_discipline);
    } else {
      query = query.is('sub_discipline', null);
    }

    // For exam_year, we need to show numbers from:
    // 1. The selected promo (if specified)
    // 2. Questions with NULL exam_year (old data that could conflict)
    // This helps managers see ALL potentially conflicting numbers
    if (params.exam_year) {
      // Show numbers from selected promo OR from questions without promo (NULL)
      query = query.or(`exam_year.eq.${params.exam_year},exam_year.is.null`);
    } else {
      // If no promo selected, only show questions without promo
      query = query.is('exam_year', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Extract all existing numbers
    const existingNumbers: number[] = data ? data.map(q => q.number) : [];
    
    // Find the first missing number (gap) or next after max
    let suggestedNext = 1;
    for (let i = 1; i <= (existingNumbers.length + 1); i++) {
      if (!existingNumbers.includes(i)) {
        suggestedNext = i;
        break;
      }
    }
    
    return {
      success: true,
      data: {
        existingNumbers,
        suggestedNext,
        count: existingNumbers.length,
      },
    };
  } catch (error: any) {
    console.error('Error fetching existing question numbers:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch existing question numbers',
      data: { existingNumbers: [], suggestedNext: 1, count: 0 },
    };
  }
}
