// API route for questions CRUD operations
// Uses service role key to bypass RLS (server-side only)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdminUser } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET /api/questions - List all questions
export async function GET(request: NextRequest) {
  try {
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create new question
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No auth token' },
        { status: 401 }
      );
    }

    // Verify session with anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { isAdmin, role } = await verifyAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: `Forbidden - Role '${role}' cannot create questions` },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { question, answers } = body;

    // Insert question using admin client (bypasses RLS)
    const questionData = {
      year: question.year,
      module_name: question.module_name,
      sub_discipline: question.sub_discipline || null,
      exam_type: question.exam_type,
      number: question.number,
      question_text: question.question_text,
      speciality: question.speciality || null,
      cours: question.cours || null,
      unity_name: question.unity_name || null,
      module_type: question.module_type,
      created_by: user.id, // Track who created the question
    };

    const { data: newQuestion, error: questionError } = await supabaseAdmin
      .from('questions')
      .insert(questionData as any)
      .select()
      .single();

    if (questionError) throw questionError;
    if (!newQuestion) throw new Error('Failed to create question');

    // Type assertion for newQuestion
    const questionRecord = newQuestion as any;

    // Insert answers
    const answersToInsert = answers.map((answer: any) => ({
      question_id: questionRecord.id,
      option_label: answer.option_label,
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
      display_order: answer.display_order,
    }));

    const { data: newAnswers, error: answersError } = await supabaseAdmin
      .from('answers')
      .insert(answersToInsert as any)
      .select();

    if (answersError) {
      // Rollback: delete the question
      await supabaseAdmin.from('questions').delete().eq('id', questionRecord.id);
      throw answersError;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...questionRecord,
        answers: newAnswers || [],
      },
    });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/:id - Delete question
export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { isAdmin } = await verifyAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get question ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }

    // Delete question (answers will cascade delete)
    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
