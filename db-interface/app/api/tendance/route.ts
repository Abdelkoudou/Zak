/**
 * API route for tendance (course repetition) analysis
 * Returns cours topics ranked by frequency, grouped by module + sub_discipline
 * Owner-only access
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  requireAuthenticatedAdmin,
  applyRateLimit,
  sanitizeError,
} from '@/lib/security/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult.error) return rateLimitResult.error;

    // Auth: owner only
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Check owner role
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authResult.user.id)
      .single();

    if (!userData || userData.role !== 'owner') {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    // Fetch all questions with cours, exam_year, and exam_type
    const FETCH_LIMIT = 50000;
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('module_name, sub_discipline, cours, exam_year, exam_type')
      .not('cours', 'is', null)
      .not('exam_year', 'is', null)
      .limit(FETCH_LIMIT);

    if (error) throw error;
    const isTruncated = (questions?.length ?? 0) >= FETCH_LIMIT;

    // Granular aggregation: (module, subDisc, course, examYear, examType)
    interface GranularEntry {
      m: string;   // module
      sd: string;  // sub-discipline
      c: string;   // course
      ey: number;  // exam year
      et: string;  // exam type
      cnt: number; // total questions for this combination
    }

    const granularMap: Record<string, GranularEntry> = {};
    const allExamYears = new Set<number>();
    const allExamTypes = new Set<string>();

    for (const q of questions || []) {
      if (!q.cours || !Array.isArray(q.cours) || !q.exam_year || !q.module_name) continue;
      const subDisc = q.sub_discipline || q.module_name;
      const examType = q.exam_type || 'Inconnu';
      
      allExamYears.add(q.exam_year);
      allExamTypes.add(examType);

      for (const c of q.cours) {
        const key = `${q.module_name}|||${subDisc}|||${c}|||${q.exam_year}|||${examType}`;
        if (!granularMap[key]) {
          granularMap[key] = {
            m: q.module_name,
            sd: subDisc,
            c: c,
            ey: q.exam_year,
            et: examType,
            cnt: 0,
          };
        }
        granularMap[key].cnt += 1;
      }
    }

    const data = Object.values(granularMap);

    return NextResponse.json(
      { 
        data, 
        availableExamYears: Array.from(allExamYears).sort((a, b) => b - a),
        availableExamTypes: Array.from(allExamTypes).sort(),
        isTruncated 
      },
      { headers: rateLimitResult.headers }
    );
  } catch (error: any) {
    console.error('[tendance] API Error:', error);
    return NextResponse.json(
      { error: sanitizeError(error) },
      { status: 500 }
    );
  }
}
