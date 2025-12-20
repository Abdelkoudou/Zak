// API route to export questions from database to JSON and upload to Supabase Storage
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

interface ModuleQuestions {
  [key: string]: any[];
}

interface QuestionWithAnswers {
  id: string;
  year: number;
  module_name: string;
  sub_discipline: string | null;
  exam_type: string;
  number: number;
  question_text: string;
  explanation: string | null;
  answers: Array<{
    id: string;
    option_label: string;
    answer_text: string;
    is_correct: boolean;
    display_order: number;
  }>;
}

// POST /api/export - Export all questions to JSON and upload to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
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

    const { isOwner } = await verifyOwner(user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Owner access required' },
        { status: 403 }
      );
    }

    console.log('🔄 Starting export process...');

    // Get all questions with answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        answers (*)
      `)
      .order('year', { ascending: true })
      .order('module_name', { ascending: true })
      .order('number', { ascending: true });

    if (questionsError) throw questionsError;

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No questions found in database'
      });
    }

    console.log(`📊 Found ${questions.length} questions`);

    // Group questions by year and module
    const groupedQuestions: { [key: string]: ModuleQuestions } = {};

    for (const question of questions as QuestionWithAnswers[]) {
      const year = question.year;
      const moduleName = question.module_name.toLowerCase().replace(/\s+/g, '_');
      const key = `year${year}`;

      if (!groupedQuestions[key]) {
        groupedQuestions[key] = {};
      }

      if (!groupedQuestions[key][moduleName]) {
        groupedQuestions[key][moduleName] = [];
      }

      groupedQuestions[key][moduleName].push(question);
    }

    console.log('📦 Grouped questions by modules');

    // Export each module to JSON and upload to Supabase Storage
    const uploadedModules: any = {};
    let totalUploaded = 0;

    for (const [yearKey, modules] of Object.entries(groupedQuestions)) {
      for (const [moduleName, moduleQuestions] of Object.entries(modules)) {
        const moduleData = {
          version: '1.0.0',
          module: moduleQuestions[0].module_name,
          study_year: moduleQuestions[0].year,
          exam_types: [...new Set(moduleQuestions.map(q => q.exam_type))],
          last_updated: new Date().toISOString(),
          questions_count: moduleQuestions.length,
          questions: moduleQuestions.map(q => ({
            id: `${q.year}_${q.module_name}_${q.number}`,
            year: q.year,
            study_year: q.year,
            module: q.module_name,
            sub_discipline: q.sub_discipline,
            exam_type: q.exam_type,
            number: q.number,
            question_text: q.question_text,
            explanation: q.explanation,
            answers: q.answers
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((a: any) => ({
                label: a.option_label,
                text: a.answer_text,
                is_correct: a.is_correct,
                display_order: a.display_order
              }))
          }))
        };

        // Convert to JSON
        const jsonContent = JSON.stringify(moduleData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });

        // Upload to Supabase Storage
        const filePath = `${yearKey}/${moduleName}.json`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('questions')
          .upload(filePath, blob, {
            contentType: 'application/json',
            upsert: true // Replace if exists
          });

        if (uploadError) {
          console.error(`❌ Failed to upload ${filePath}:`, uploadError);
          throw uploadError;
        }

        console.log(`✅ Uploaded ${filePath} (${moduleQuestions.length} questions)`);

        // Track uploaded module
        const moduleKey = `${yearKey}_${moduleName}`;
        uploadedModules[moduleKey] = {
          version: '1.0.0',
          size: blob.size,
          questions_count: moduleQuestions.length,
          last_updated: new Date().toISOString(),
          path: filePath
        };

        totalUploaded++;
      }
    }

    // Create and upload version.json
    const versionData = {
      version: '1.0.0',
      last_updated: new Date().toISOString(),
      total_questions: questions.length,
      total_modules: totalUploaded,
      modules: uploadedModules,
      changelog: [
        {
          version: '1.0.0',
          date: new Date().toISOString().split('T')[0],
          changes: `Exported ${questions.length} questions across ${totalUploaded} modules`
        }
      ]
    };

    const versionBlob = new Blob([JSON.stringify(versionData, null, 2)], {
      type: 'application/json'
    });

    const { error: versionError } = await supabaseAdmin.storage
      .from('questions')
      .upload('version.json', versionBlob, {
        contentType: 'application/json',
        upsert: true
      });

    if (versionError) throw versionError;

    console.log('✅ Uploaded version.json');

    return NextResponse.json({
      success: true,
      message: `Successfully exported ${questions.length} questions to ${totalUploaded} modules`,
      data: {
        total_questions: questions.length,
        total_modules: totalUploaded,
        modules: Object.keys(uploadedModules),
        version: versionData.version
      }
    });

  } catch (error: any) {
    console.error('❌ Export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}

// GET /api/export/status - Check export status and list uploaded files
export async function GET(request: NextRequest) {
  try {
    // List all files in questions bucket
    const { data: files, error } = await supabaseAdmin.storage
      .from('questions')
      .list();

    if (error) throw error;

    // Get version.json
    const { data: versionData, error: versionError } = await supabaseAdmin.storage
      .from('questions')
      .download('version.json');

    let version = null;
    if (!versionError && versionData) {
      const text = await versionData.text();
      version = JSON.parse(text);
    }

    return NextResponse.json({
      success: true,
      data: {
        files: files?.map(f => ({
          name: f.name,
          size: f.metadata?.size,
          updated: f.updated_at
        })),
        version: version,
        storage_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/questions/`
      }
    });

  } catch (error: any) {
    console.error('Error getting export status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
