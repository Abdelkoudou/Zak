import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ── Helper: validate a Supabase query result ────────────────────────
function checkResult<T>(
  result: { data: T | null; error: any },
  queryName: string
): T {
  if (result.error) {
    console.error(`[stats] Query "${queryName}" failed:`, result.error);
    throw new Error(`Query "${queryName}" failed: ${result.error.message}`);
  }
  return result.data ?? ([] as unknown as T);
}

// ── Helper: compute tendance (course repetition) stats ──────────────
function computeTendance(questions: any[]) {
  // Flatten: one entry per (module, cours_topic, exam_year)
  const flat: { module: string; cours: string; examYear: number; examType: string }[] = [];
  for (const q of questions) {
    if (!q.cours || !Array.isArray(q.cours) || !q.exam_year) continue;
    for (const c of q.cours) {
      flat.push({ module: q.module_name, cours: c, examYear: q.exam_year, examType: q.exam_type });
    }
  }

  // Total distinct exam years in the dataset
  const allExamYears = new Set(flat.map((f) => f.examYear));
  const totalExamYears = allExamYears.size;

  // Per-cours stats
  const coursMap: Record<string, {
    module: string;
    yearsSet: Set<number>;
    totalQuestions: number;
    examYears: number[];
  }> = {};

  for (const f of flat) {
    const key = `${f.module}|||${f.cours}`;
    if (!coursMap[key]) {
      coursMap[key] = { module: f.module, yearsSet: new Set(), totalQuestions: 0, examYears: [] };
    }
    coursMap[key].yearsSet.add(f.examYear);
    coursMap[key].totalQuestions += 1;
  }

  const coursStats = Object.entries(coursMap)
    .map(([key, data]) => {
      const [module, cours] = key.split('|||');
      const yearsAppeared = data.yearsSet.size;
      return {
        module,
        cours,
        yearsAppeared,
        totalQuestions: data.totalQuestions,
        tendanceScore: Math.round((yearsAppeared / totalExamYears) * 100),
        examYears: Array.from(data.yearsSet).sort((a, b) => a - b),
      };
    })
    .sort((a, b) => b.tendanceScore - a.tendanceScore || b.totalQuestions - a.totalQuestions);

  // Per-module summary
  const moduleMap: Record<string, {
    totalCours: number;
    alwaysTendable: number;
    oftenTendable: number;
    totalQuestions: number;
    coursTopics: string[];
  }> = {};

  for (const cs of coursStats) {
    if (!moduleMap[cs.module]) {
      moduleMap[cs.module] = { totalCours: 0, alwaysTendable: 0, oftenTendable: 0, totalQuestions: 0, coursTopics: [] };
    }
    moduleMap[cs.module].totalCours += 1;
    moduleMap[cs.module].totalQuestions += cs.totalQuestions;
    if (cs.yearsAppeared === totalExamYears) moduleMap[cs.module].alwaysTendable += 1;
    else if (cs.yearsAppeared >= totalExamYears - 2) moduleMap[cs.module].oftenTendable += 1;
  }

  const moduleSummary = Object.entries(moduleMap)
    .map(([name, data]) => ({
      module: name,
      totalCours: data.totalCours,
      alwaysTendable: data.alwaysTendable,
      oftenTendable: data.oftenTendable,
      totalQuestions: data.totalQuestions,
      tendabilityPct: Math.round((data.alwaysTendable / data.totalCours) * 100),
    }))
    .sort((a, b) => b.tendabilityPct - a.tendabilityPct);

  return {
    totalExamYears,
    totalCours: coursStats.length,
    alwaysTendableCount: coursStats.filter((c) => c.yearsAppeared === totalExamYears).length,
    topCours: coursStats.slice(0, 30), // Top 30 for the chart
    moduleSummary,
  };
}

export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth gate: verify caller is authenticated owner ──────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[stats] Missing env vars:', {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
      });
      return NextResponse.json(
        { error: 'Configuration serveur manquante (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)' },
        { status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { isOwner } = await verifyOwner(currentUser.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // ── 2. Parse & validate date filters ────────────────────────────
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;

    if (fromParam) {
      dateFrom = new Date(fromParam);
      if (isNaN(dateFrom.getTime())) {
        return NextResponse.json(
          { error: `Paramètre "from" invalide: "${fromParam}"` },
          { status: 400 }
        );
      }
    }
    if (toParam) {
      dateTo = new Date(toParam);
      if (isNaN(dateTo.getTime())) {
        return NextResponse.json(
          { error: `Paramètre "to" invalide: "${toParam}"` },
          { status: 400 }
        );
      }
      // Set to end of day for inclusive filtering
      dateTo.setHours(23, 59, 59, 999);
    }

    const hasDateFilter = !!(dateFrom || dateTo);

    // Helper: check if a date falls within range
    function inRangeOrNoFilter(dateStr: string | null | undefined): boolean {
      if (!hasDateFilter) return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    }

    // ── 3. Build server-side filtered queries ───────────────────────
    // Users: always fetch all (needed for demographic breakdowns)
    const usersQuery = supabaseAdmin
      .from('users')
      .select('id, role, is_paid, faculty, region, speciality, year_of_study, created_at, subscription_expires_at')
      .limit(10000);

    // Questions: apply date filter server-side
    let questionsQuery = supabaseAdmin
      .from('questions')
      .select('id, module_name, exam_type, year, faculty_source, speciality, created_at')
      .limit(10000);
    if (dateFrom) questionsQuery = questionsQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) questionsQuery = questionsQuery.lte('created_at', dateTo.toISOString());

    // Test attempts: filter by completed_at
    let testAttemptsQuery = supabaseAdmin
      .from('test_attempts')
      .select('id, user_id, module_name, score_percentage, time_spent_seconds, total_questions, correct_answers, completed_at')
      .limit(10000);
    if (dateFrom) testAttemptsQuery = testAttemptsQuery.gte('completed_at', dateFrom.toISOString());
    if (dateTo) testAttemptsQuery = testAttemptsQuery.lte('completed_at', dateTo.toISOString());

    // Activation keys: filter by created_at
    let activationKeysQuery = supabaseAdmin
      .from('activation_keys')
      .select('id, is_used, payment_source, used_at, created_at, faculty_id, sales_point_id')
      .limit(10000);
    if (dateFrom) activationKeysQuery = activationKeysQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) activationKeysQuery = activationKeysQuery.lte('created_at', dateTo.toISOString());

    // Device sessions: filter by last_active_at
    let deviceSessionsQuery = supabaseAdmin
      .from('device_sessions')
      .select('id, user_id, last_active_at, device_name')
      .limit(10000);
    if (dateFrom) deviceSessionsQuery = deviceSessionsQuery.gte('last_active_at', dateFrom.toISOString());
    if (dateTo) deviceSessionsQuery = deviceSessionsQuery.lte('last_active_at', dateTo.toISOString());

    // Online payments: filter by created_at
    let onlinePaymentsQuery = supabaseAdmin
      .from('online_payments')
      .select('id, status, amount, duration_days, payment_method, created_at, paid_at')
      .limit(10000);
    if (dateFrom) onlinePaymentsQuery = onlinePaymentsQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) onlinePaymentsQuery = onlinePaymentsQuery.lte('created_at', dateTo.toISOString());

    // Modules: small table, no filter needed
    const modulesQuery = supabaseAdmin
      .from('modules')
      .select('id, name, year, type');

    // Saved questions
    let savedQuestionsQuery = supabaseAdmin
      .from('saved_questions')
      .select('id, created_at')
      .limit(10000);
    if (dateFrom) savedQuestionsQuery = savedQuestionsQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) savedQuestionsQuery = savedQuestionsQuery.lte('created_at', dateTo.toISOString());

    // Question reports
    let questionReportsQuery = supabaseAdmin
      .from('question_reports')
      .select('id, status, created_at')
      .limit(10000);
    if (dateFrom) questionReportsQuery = questionReportsQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) questionReportsQuery = questionReportsQuery.lte('created_at', dateTo.toISOString());

    // User feedback
    let feedbackQuery = supabaseAdmin
      .from('user_feedback')
      .select('id, feedback_type, rating, created_at')
      .limit(10000);
    if (dateFrom) feedbackQuery = feedbackQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) feedbackQuery = feedbackQuery.lte('created_at', dateTo.toISOString());

    // Chat logs
    let chatLogsQuery = supabaseAdmin
      .from('chat_logs')
      .select('id, created_at')
      .limit(10000);
    if (dateFrom) chatLogsQuery = chatLogsQuery.gte('created_at', dateFrom.toISOString());
    if (dateTo) chatLogsQuery = chatLogsQuery.lte('created_at', dateTo.toISOString());

    // Also fetch unfiltered activation keys for timeline (used_at filter is different)
    const allActivationKeysQuery = supabaseAdmin
      .from('activation_keys')
      .select('id, is_used, used_at, created_at')
      .limit(10000);

    // Also fetch all questions for tendance analysis (unfiltered — needs all historical data)
    const tendanceQuestionsQuery = supabaseAdmin
      .from('questions')
      .select('module_name, cours, exam_year, exam_type')
      .not('cours', 'is', null)
      .not('exam_year', 'is', null)
      .limit(10000);

    // Also fetch all device sessions for active users calculation
    const allDeviceSessionsQuery = supabaseAdmin
      .from('device_sessions')
      .select('id, user_id, last_active_at')
      .limit(10000);

    // ── 4. Execute all queries in parallel ──────────────────────────
    const [
      usersResult,
      questionsResult,
      testAttemptsResult,
      activationKeysResult,
      deviceSessionsResult,
      onlinePaymentsResult,
      modulesResult,
      savedQuestionsResult,
      questionReportsResult,
      feedbackResult,
      chatLogsResult,
      allActivationKeysResult,
      allDeviceSessionsResult,
      tendanceQuestionsResult,
    ] = await Promise.all([
      usersQuery,
      questionsQuery,
      testAttemptsQuery,
      activationKeysQuery,
      deviceSessionsQuery,
      onlinePaymentsQuery,
      modulesQuery,
      savedQuestionsQuery,
      questionReportsQuery,
      feedbackQuery,
      chatLogsQuery,
      allActivationKeysQuery,
      allDeviceSessionsQuery,
      tendanceQuestionsQuery,
    ]);

    // ── 5. Validate all query results ───────────────────────────────
    const allUsers = checkResult(usersResult, 'users');
    const questions = checkResult(questionsResult, 'questions');
    const testAttempts = checkResult(testAttemptsResult, 'test_attempts');
    const activationKeys = checkResult(activationKeysResult, 'activation_keys');
    const deviceSessions = checkResult(deviceSessionsResult, 'device_sessions');
    const onlinePayments = checkResult(onlinePaymentsResult, 'online_payments');
    const modules = checkResult(modulesResult, 'modules');
    const savedQuestions = checkResult(savedQuestionsResult, 'saved_questions');
    const questionReports = checkResult(questionReportsResult, 'question_reports');
    const feedback = checkResult(feedbackResult, 'user_feedback');
    const chatLogs = checkResult(chatLogsResult, 'chat_logs');
    const allActivationKeys = checkResult(allActivationKeysResult, 'activation_keys (all)');
    const allDeviceSessions = checkResult(allDeviceSessionsResult, 'device_sessions (all)');
    const tendanceQuestions = checkResult(tendanceQuestionsResult, 'tendance_questions') as any[];

    // ── 6. Compute stats ────────────────────────────────────────────
    const allStudents = allUsers.filter((u) => u.role === 'student');
    const students = allStudents.filter((s) => s.is_paid && s.faculty && s.faculty.trim() !== '');
    const studentsInRange = students.filter((u) => inRangeOrNoFilter(u.created_at));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active users (always real-time)
    const activeUsersLast7Days = new Set(
      allDeviceSessions
        .filter((s) => new Date(s.last_active_at) > sevenDaysAgo)
        .map((s) => s.user_id)
    ).size;

    const activeUsersLast30Days = new Set(
      allDeviceSessions
        .filter((s) => new Date(s.last_active_at) > thirtyDaysAgo)
        .map((s) => s.user_id)
    ).size;

    // Users by faculty
    const usersByFaculty: Record<string, number> = {};
    students.forEach((u) => {
      const key = u.faculty || 'Non renseigné';
      usersByFaculty[key] = (usersByFaculty[key] || 0) + 1;
    });

    // Users by year of study
    const usersByYear: Record<string, number> = {};
    students.forEach((u) => {
      const key = u.year_of_study || 'Non renseigné';
      usersByYear[key] = (usersByYear[key] || 0) + 1;
    });

    // Users by speciality
    const usersBySpeciality: Record<string, number> = {};
    students.forEach((u) => {
      const key = u.speciality || 'Non renseigné';
      usersBySpeciality[key] = (usersBySpeciality[key] || 0) + 1;
    });

    // Questions by module (normalize null keys)
    const questionsByModule: Record<string, number> = {};
    questions.forEach((q) => {
      const key = q.module_name ?? 'Inconnu';
      questionsByModule[key] = (questionsByModule[key] || 0) + 1;
    });

    // Questions by exam type (normalize null keys)
    const questionsByExamType: Record<string, number> = {};
    questions.forEach((q) => {
      const key = q.exam_type ?? 'Inconnu';
      questionsByExamType[key] = (questionsByExamType[key] || 0) + 1;
    });

    // Test attempts by module
    const attemptsByModule: Record<string, { attempts: number; totalScore: number; uniqueUsers: Set<string> }> = {};
    testAttempts.forEach((t) => {
      const key = t.module_name ?? 'Inconnu';
      if (!attemptsByModule[key]) {
        attemptsByModule[key] = { attempts: 0, totalScore: 0, uniqueUsers: new Set() };
      }
      attemptsByModule[key].attempts += 1;
      attemptsByModule[key].totalScore += Number(t.score_percentage);
      attemptsByModule[key].uniqueUsers.add(t.user_id);
    });

    const topModulesByAttempts = Object.entries(attemptsByModule)
      .map(([name, data]) => ({
        module: name,
        attempts: data.attempts,
        avgScore: Math.round(data.totalScore / data.attempts * 10) / 10,
        uniqueUsers: data.uniqueUsers.size,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    // Avg score & time
    const totalScore = testAttempts.reduce((sum, t) => sum + Number(t.score_percentage), 0);
    const avgScore = testAttempts.length > 0 ? Math.round(totalScore / testAttempts.length * 10) / 10 : 0;
    const totalTimeSeconds = testAttempts.reduce((sum, t) => sum + (t.time_spent_seconds || 0), 0);
    const avgTimeSeconds = testAttempts.length > 0 ? Math.round(totalTimeSeconds / testAttempts.length) : 0;
    const totalQuestionsAnswered = testAttempts.reduce((sum, t) => sum + t.total_questions, 0);

    // Registrations by month
    const registrationsByMonth: Record<string, number> = {};
    studentsInRange.forEach((u) => {
      if (u.created_at) {
        const date = new Date(u.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        registrationsByMonth[key] = (registrationsByMonth[key] || 0) + 1;
      }
    });
    const registrationTimeline = Object.entries(registrationsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Activation key usage over time
    const activationsByMonth: Record<string, number> = {};
    allActivationKeys
      .filter((k) => k.is_used && k.used_at && inRangeOrNoFilter(k.used_at))
      .forEach((k) => {
        const date = new Date(k.used_at!);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        activationsByMonth[key] = (activationsByMonth[key] || 0) + 1;
      });
    const activationTimeline = Object.entries(activationsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Activation key breakdown
    const keysUsed = activationKeys.filter((k) => k.is_used).length;
    const keysUnused = activationKeys.filter((k) => !k.is_used).length;
    const keysManual = activationKeys.filter((k) => k.payment_source === 'manual').length;
    const keysOnline = activationKeys.filter((k) => k.payment_source === 'online').length;

    // Online payments stats
    const paidPayments = onlinePayments.filter((p) => p.status === 'paid');
    const totalOnlineRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Per-offer breakdown
    const offerMap: Record<string, { count: number; revenue: number; durationDays: number }> = {};
    paidPayments.forEach((p) => {
      const key = `${p.amount}`;
      if (!offerMap[key]) {
        offerMap[key] = { count: 0, revenue: 0, durationDays: p.duration_days || 0 };
      }
      offerMap[key].count += 1;
      offerMap[key].revenue += p.amount || 0;
    });

    const OFFER_LABELS: Record<string, string> = {
      '1000': '1 An (1000 DA)',
      '300': '20 Jours (300 DA)',
    };

    const offerBreakdown = Object.entries(offerMap)
      .map(([amount, data]) => ({
        offerName: OFFER_LABELS[amount] || `${amount} DA`,
        amount: parseInt(amount),
        count: data.count,
        revenue: data.revenue,
        durationDays: data.durationDays,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Subscription status (always current snapshot)
    const expiredSubs = students.filter(
      (s) => s.subscription_expires_at && new Date(s.subscription_expires_at) < now
    ).length;

    const response = {
      dateFilter: {
        from: fromParam || null,
        to: toParam || null,
        applied: hasDateFilter,
      },
      overview: {
        totalStudents: students.length,
        newStudentsInRange: studentsInRange.length,
        expiredSubscriptions: expiredSubs,
        totalQuestions: questions.length,
        totalModules: modules.length,
        totalTestAttempts: testAttempts.length,
        totalQuestionsAnswered,
        activeUsersLast7Days,
        activeUsersLast30Days,
        totalDeviceSessions: deviceSessions.length,
        totalActivationKeys: activationKeys.length,
        keysUsed,
        keysUnused,
        savedQuestions: savedQuestions.length,
        questionReports: questionReports.length,
        feedbackCount: feedback.length,
        chatLogCount: chatLogs.length,
      },
      users: {
        byFaculty: Object.entries(usersByFaculty)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        byYear: Object.entries(usersByYear)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        bySpeciality: Object.entries(usersBySpeciality)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
      engagement: {
        avgScore,
        avgTimeSeconds,
        totalQuestionsAnswered,
        uniqueTesters: new Set(testAttempts.map((t) => t.user_id)).size,
        topModulesByAttempts,
      },
      content: {
        questionsByModule: Object.entries(questionsByModule)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        questionsByExamType: Object.entries(questionsByExamType)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
      growth: {
        registrationTimeline,
        activationTimeline,
      },
      revenue: {
        keysManual,
        keysOnline,
        totalOnlineRevenue,
        paidPaymentsCount: paidPayments.length,
        offerBreakdown,
      },
      tendance: computeTendance(tendanceQuestions),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[stats] API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
