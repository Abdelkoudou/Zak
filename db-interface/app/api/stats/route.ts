import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Parse date filter from query params
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const dateFrom = fromParam ? new Date(fromParam) : null;
    const dateTo = toParam ? new Date(toParam) : null;

    // Helper: check if a date string falls within the filter range
    function inRange(dateStr: string | null | undefined): boolean {
      if (!dateStr) return false;
      if (!dateFrom && !dateTo) return true;
      const d = new Date(dateStr);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    }

    // Helper: check if a date falls within range (always true when no filter)
    function inRangeOrNoFilter(dateStr: string | null | undefined): boolean {
      if (!dateFrom && !dateTo) return true;
      return inRange(dateStr);
    }

    // Run all queries in parallel for performance
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
    ] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, role, is_paid, faculty, region, speciality, year_of_study, created_at, subscription_expires_at'),
      supabaseAdmin
        .from('questions')
        .select('id, module_name, exam_type, year, faculty_source, speciality, created_at'),
      supabaseAdmin
        .from('test_attempts')
        .select('id, user_id, module_name, score_percentage, time_spent_seconds, total_questions, correct_answers, completed_at'),
      supabaseAdmin
        .from('activation_keys')
        .select('id, is_used, payment_source, used_at, created_at, faculty_id, sales_point_id'),
      supabaseAdmin
        .from('device_sessions')
        .select('id, user_id, last_active_at, device_name'),
      supabaseAdmin
        .from('online_payments')
        .select('id, status, amount, payment_method, created_at, paid_at'),
      supabaseAdmin
        .from('modules')
        .select('id, name, year, type'),
      supabaseAdmin
        .from('saved_questions')
        .select('id, created_at'),
      supabaseAdmin
        .from('question_reports')
        .select('id, status, created_at'),
      supabaseAdmin
        .from('user_feedback')
        .select('id, feedback_type, rating, created_at'),
      supabaseAdmin
        .from('chat_logs')
        .select('id, created_at'),
    ]);

    const allUsers = usersResult.data || [];
    const allQuestions = questionsResult.data || [];
    const allTestAttempts = testAttemptsResult.data || [];
    const allActivationKeys = activationKeysResult.data || [];
    const allDeviceSessions = deviceSessionsResult.data || [];
    const allOnlinePayments = onlinePaymentsResult.data || [];
    const modules = modulesResult.data || [];
    const allSavedQuestions = savedQuestionsResult.data || [];
    const allQuestionReports = questionReportsResult.data || [];
    const allFeedback = feedbackResult.data || [];
    const allChatLogs = chatLogsResult.data || [];

    // Apply date filters to time-sensitive data
    // Users: filter by created_at (registrations in range)
    const allStudents = allUsers.filter((u) => u.role === 'student');
    const students = allStudents.filter((s) => s.is_paid && s.faculty && s.faculty.trim() !== '');
    const studentsInRange = students.filter((u) => inRangeOrNoFilter(u.created_at));

    // Questions created in range
    const questions = allQuestions.filter((q) => inRangeOrNoFilter(q.created_at));

    // Test attempts completed in range
    const testAttempts = allTestAttempts.filter((t) => inRangeOrNoFilter(t.completed_at));

    // Activation keys created in range
    const activationKeys = allActivationKeys.filter((k) => inRangeOrNoFilter(k.created_at));

    // Device sessions active in range
    const deviceSessions = allDeviceSessions.filter((s) => inRangeOrNoFilter(s.last_active_at));

    // Online payments in range
    const onlinePayments = allOnlinePayments.filter((p) => inRangeOrNoFilter(p.created_at));

    // Other tables filtered by created_at
    const savedQuestions = allSavedQuestions.filter((s) => inRangeOrNoFilter(s.created_at));
    const questionReports = allQuestionReports.filter((r) => inRangeOrNoFilter(r.created_at));
    const feedback = allFeedback.filter((f) => inRangeOrNoFilter(f.created_at));
    const chatLogs = allChatLogs.filter((c) => inRangeOrNoFilter(c.created_at));

    // --- Computed Stats ---

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active users (always based on real-time, not date filter)
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

    // Users by faculty (use all students for distribution, not filtered)
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

    // Questions by module (filtered)
    const questionsByModule: Record<string, number> = {};
    questions.forEach((q) => {
      questionsByModule[q.module_name] = (questionsByModule[q.module_name] || 0) + 1;
    });

    // Questions by exam type (filtered)
    const questionsByExamType: Record<string, number> = {};
    questions.forEach((q) => {
      questionsByExamType[q.exam_type] = (questionsByExamType[q.exam_type] || 0) + 1;
    });

    // Test attempts by module (filtered)
    const attemptsByModule: Record<string, { attempts: number; totalScore: number; uniqueUsers: Set<string> }> = {};
    testAttempts.forEach((t) => {
      if (!attemptsByModule[t.module_name]) {
        attemptsByModule[t.module_name] = { attempts: 0, totalScore: 0, uniqueUsers: new Set() };
      }
      attemptsByModule[t.module_name].attempts += 1;
      attemptsByModule[t.module_name].totalScore += Number(t.score_percentage);
      attemptsByModule[t.module_name].uniqueUsers.add(t.user_id);
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

    // Avg score & time (filtered)
    const totalScore = testAttempts.reduce((sum, t) => sum + Number(t.score_percentage), 0);
    const avgScore = testAttempts.length > 0 ? Math.round(totalScore / testAttempts.length * 10) / 10 : 0;
    const totalTimeSeconds = testAttempts.reduce((sum, t) => sum + (t.time_spent_seconds || 0), 0);
    const avgTimeSeconds = testAttempts.length > 0 ? Math.round(totalTimeSeconds / testAttempts.length) : 0;
    const totalQuestionsAnswered = testAttempts.reduce((sum, t) => sum + t.total_questions, 0);

    // User registrations by month (filtered)
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

    // Activation key usage over time (filtered by used_at)
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

    // Activation key breakdown (filtered)
    const keysUsed = activationKeys.filter((k) => k.is_used).length;
    const keysUnused = activationKeys.filter((k) => !k.is_used).length;
    const keysManual = activationKeys.filter((k) => k.payment_source === 'manual').length;
    const keysOnline = activationKeys.filter((k) => k.payment_source === 'online').length;

    // Online payments stats (filtered)
    const paidPayments = onlinePayments.filter((p) => p.status === 'paid');
    const totalOnlineRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Subscription status (always current snapshot, only paid students)
    const expiredSubs = students.filter(
      (s) => s.subscription_expires_at && new Date(s.subscription_expires_at) < now
    ).length;

    const response = {
      dateFilter: {
        from: fromParam || null,
        to: toParam || null,
        applied: !!(fromParam || toParam),
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
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
