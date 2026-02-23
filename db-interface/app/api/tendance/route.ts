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

    // Fetch all questions with cours and exam_year (no hard limit for analytics accuracy)
    const FETCH_LIMIT = 50000;
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select('module_name, sub_discipline, cours, exam_year')
      .not('cours', 'is', null)
      .not('exam_year', 'is', null)
      .limit(FETCH_LIMIT);

    if (error) throw error;
    const isTruncated = (questions?.length ?? 0) >= FETCH_LIMIT;

    // Flatten: one entry per (module, sub_discipline, cours_topic, exam_year)
    interface FlatEntry {
      module: string;
      subDisc: string;
      cours: string;
      examYear: number;
    }

    const flat: FlatEntry[] = [];
    for (const q of questions || []) {
      if (!q.cours || !Array.isArray(q.cours) || !q.exam_year || !q.module_name) continue;
      const subDisc = q.sub_discipline || q.module_name;
      for (const c of q.cours) {
        flat.push({
          module: q.module_name,
          subDisc,
          cours: c,
          examYear: q.exam_year,
        });
      }
    }

    // Get total distinct exam years
    const allExamYears = new Set(flat.map((f) => f.examYear));

    // Group by (module, subDisc, cours) → count questions + years appeared
    const coursMap: Record<
      string,
      { module: string; subDisc: string; cours: string; yearsSet: Set<number>; count: number }
    > = {};

    for (const f of flat) {
      const key = `${f.module}|||${f.subDisc}|||${f.cours}`;
      if (!coursMap[key]) {
        coursMap[key] = {
          module: f.module,
          subDisc: f.subDisc,
          cours: f.cours,
          yearsSet: new Set(),
          count: 0,
        };
      }
      coursMap[key].yearsSet.add(f.examYear);
      coursMap[key].count += 1;
    }

    // Convert to sorted array
    const result = Object.values(coursMap)
      .map((entry) => ({
        module_name: entry.module,
        sub_discipline: entry.subDisc,
        cours_topic: entry.cours,
        question_count: entry.count,
        years_appeared: entry.yearsSet.size,
        exam_years_list: Array.from(entry.yearsSet).sort((a, b) => a - b),
      }))
      .sort((a, b) => {
        // Sort by module, then sub_discipline, then question_count DESC
        if (a.module_name !== b.module_name) return a.module_name.localeCompare(b.module_name);
        if (a.sub_discipline !== b.sub_discipline)
          return a.sub_discipline.localeCompare(b.sub_discipline);
        return b.question_count - a.question_count;
      });

    return NextResponse.json(
      { data: result, totalExamYears: allExamYears.size, isTruncated },
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
