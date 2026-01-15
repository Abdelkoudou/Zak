/**
 * API route for questions CRUD operations
 * Secured with authentication, authorization, validation, and rate limiting
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  validateBody,
  validateParam,
  requireAuthenticatedAdmin,
  applyRateLimit,
  sanitizeError,
  successResponse,
  errorResponse,
} from '@/lib/security/api-utils';
import {
  createQuestionSchema,
  updateQuestionSchema,
  uuidSchema,
} from '@/lib/security/validation';

// GET /api/questions - List all questions (requires admin auth)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Fetch questions with answers
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(questions, rateLimitResult.headers);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// POST /api/questions - Create new question
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(request, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Validate request body
    const bodyResult = await validateBody(request, createQuestionSchema);
    if (bodyResult.error) return bodyResult.error;

    const { question, answers } = bodyResult.data;

    // Insert question using admin client (bypasses RLS)
    const questionData = {
      year: question.year,
      module_name: question.module_name,
      sub_discipline: question.sub_discipline || null,
      exam_type: question.exam_type,
      exam_year: question.exam_year,  // Required - no fallback to null
      number: question.number,
      question_text: question.question_text,
      speciality: question.speciality || null,
      cours: question.cours || null,
      unity_name: question.unity_name || null,
      module_type: question.module_type || null,
      faculty_source: question.faculty_source || null,
      image_url: question.image_url || null,
      explanation: question.explanation || null,
      created_by: authResult.user.id,
    };

    const { data: newQuestion, error: questionError } = await supabaseAdmin
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (questionError) throw questionError;
    if (!newQuestion) throw new Error('Failed to create question');

    // Insert answers
    const answersToInsert = answers.map((answer) => ({
      question_id: newQuestion.id,
      option_label: answer.option_label,
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
      display_order: answer.display_order,
    }));

    const { data: newAnswers, error: answersError } = await supabaseAdmin
      .from('answers')
      .insert(answersToInsert)
      .select();

    if (answersError) {
      // Rollback: delete the question if answers fail
      await supabaseAdmin.from('questions').delete().eq('id', newQuestion.id);
      throw answersError;
    }

    return successResponse(
      { ...newQuestion, answers: newAnswers || [] },
      rateLimitResult.headers
    );
  } catch (error) {
    console.error('Error creating question:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// PUT /api/questions - Update question
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(request, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Validate request body
    const bodyResult = await validateBody(request, updateQuestionSchema);
    if (bodyResult.error) return bodyResult.error;

    const { id, question, answers } = bodyResult.data;

    // Update question
    const questionData = {
      year: question.year,
      module_name: question.module_name,
      sub_discipline: question.sub_discipline || null,
      exam_type: question.exam_type,
      exam_year: question.exam_year,  // Required - no fallback to null
      number: question.number,
      question_text: question.question_text,
      speciality: question.speciality || null,
      cours: question.cours || null,
      unity_name: question.unity_name || null,
      module_type: question.module_type || null,
      faculty_source: question.faculty_source || null,
      image_url: question.image_url || null,
      explanation: question.explanation || null,
    };

    const { data: updatedQuestion, error: questionError } = await supabaseAdmin
      .from('questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single();

    if (questionError) throw questionError;
    if (!updatedQuestion) throw new Error('Question not found');

    // Delete existing answers and insert new ones
    await supabaseAdmin.from('answers').delete().eq('question_id', id);

    const answersToInsert = answers.map((answer) => ({
      question_id: id,
      option_label: answer.option_label,
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
      display_order: answer.display_order,
    }));

    const { data: newAnswers, error: answersError } = await supabaseAdmin
      .from('answers')
      .insert(answersToInsert)
      .select();

    if (answersError) throw answersError;

    return successResponse(
      { ...updatedQuestion, answers: newAnswers || [] },
      rateLimitResult.headers
    );
  } catch (error) {
    console.error('Error updating question:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// DELETE /api/questions?id=xxx - Delete question
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(request, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Validate question ID
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const idResult = validateParam(idParam, uuidSchema, 'Question ID');
    if (idResult.error) return idResult.error;

    const id = idResult.data;

    // Get question to check for image
    const { data: question, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Delete image from storage if exists
    if (question?.image_url) {
      try {
        const urlParts = question.image_url.split('/question-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabaseAdmin.storage.from('question-images').remove([filePath]);
        }
      } catch (storageError) {
        console.error('Error deleting image from storage:', storageError);
        // Continue with question deletion even if image cleanup fails
      }
    }

    // Delete question (answers cascade automatically)
    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return successResponse({ deleted: true }, rateLimitResult.headers);
  } catch (error) {
    console.error('Error deleting question:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}
