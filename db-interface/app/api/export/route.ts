/**
 * API route to export questions from database to JSON and upload to Supabase Storage
 * Secured with owner-only access and rate limiting
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  requireAuthenticatedOwner,
  applyRateLimit,
  sanitizeError,
  successResponse,
  errorResponse,
} from '@/lib/security/api-utils';

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
    // Apply rate limiting for export operations (more restrictive)
    const rateLimitResult = await applyRateLimit(request, 'export');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated owner
    const authResult = await requireAuthenticatedOwner(request);
    if (authResult.error) return authResult.error;

    console.log('🔄 Starting export process...');

    // Get all questions with answers (with pagination to handle >1000 rows)
    const PAGE_SIZE = 1000;
    let allQuestions: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .order('year', { ascending: true })
        .order('module_name', { ascending: true })
        .order('number', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (questionsError) throw questionsError;

      if (questions && questions.length > 0) {
        allQuestions = [...allQuestions, ...questions];
        hasMore = questions.length === PAGE_SIZE;
        page++;
        console.log(`📊 Fetched page ${page}: ${questions.length} questions (total: ${allQuestions.length})`);
      } else {
        hasMore = false;
      }
    }

    const questions = allQuestions;

    if (!questions || questions.length === 0) {
      return errorResponse('No questions found in database', 404, rateLimitResult.headers);
    }

    console.log(`📊 Found ${questions.length} questions total`);

    // Get all modules for metadata
    const { data: allModules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('*');

    if (modulesError) throw modulesError;

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
          exam_types: [...new Set(moduleQuestions.map((q) => q.exam_type))],
          last_updated: new Date().toISOString(),
          questions_count: moduleQuestions.length,
          questions: moduleQuestions.map((q) => ({
            id: `${q.year}_${q.module_name}_${q.number}`,
            year: q.year,
            study_year: q.year,
            module: q.module_name,
            cours: (q as any).cours || [],
            sub_discipline: q.sub_discipline,
            exam_type: q.exam_type,
            number: q.number,
            question_text: q.question_text,
            explanation: q.explanation,
            image_url: (q as any).image_url || null,
            answers: q.answers
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((a: any) => ({
                label: a.option_label,
                text: a.answer_text,
                is_correct: a.is_correct,
                display_order: a.display_order,
              })),
          })),
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
            upsert: true,
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
          path: filePath,
        };

        totalUploaded++;
      }
    }

    // Create and upload version.json
    const versionData = {
      version: '1.1.0',
      last_updated: new Date().toISOString(),
      total_questions: questions.length,
      total_modules: totalUploaded,
      modules: uploadedModules,
      module_metadata: allModules,
      changelog: [
        {
          version: '1.1.0',
          date: new Date().toISOString().split('T')[0],
          changes: `Exported ${questions.length} questions across ${totalUploaded} modules (with metadata)`,
        },
      ],
    };

    const versionBlob = new Blob([JSON.stringify(versionData, null, 2)], {
      type: 'application/json',
    });

    const { error: versionError } = await supabaseAdmin.storage
      .from('questions')
      .upload('version.json', versionBlob, {
        contentType: 'application/json',
        upsert: true,
      });

    if (versionError) throw versionError;

    console.log('✅ Uploaded version.json');

    return successResponse(
      {
        total_questions: questions.length,
        total_modules: totalUploaded,
        modules: Object.keys(uploadedModules),
        version: versionData.version,
      },
      rateLimitResult.headers
    );
  } catch (error) {
    console.error('❌ Export error:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// GET /api/export/status - Check export status and list uploaded files
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated owner for status check
    const authResult = await requireAuthenticatedOwner(request);
    if (authResult.error) return authResult.error;

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

    return successResponse(
      {
        files: files?.map((f) => ({
          name: f.name,
          size: f.metadata?.size,
          updated: f.updated_at,
        })),
        version: version,
        storage_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/questions/`,
      },
      rateLimitResult.headers
    );
  } catch (error) {
    console.error('Error getting export status:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}
