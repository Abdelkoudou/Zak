import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// GET: Get chat analytics (owner only)
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user is owner
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'owner') {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get daily analytics (if view exists)
    let dailyStats: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('chat_analytics')
        .select('*')
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false });
      dailyStats = data || [];
    } catch {
      // View might not exist yet
    }

    // Get model usage stats (if view exists)
    let modelStats: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('model_usage_stats')
        .select('*')
        .limit(20);
      modelStats = data || [];
    } catch {
      // View might not exist yet
    }

    // Get overall totals from chat_messages
    const { count: totalMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    const { count: totalSessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true });

    const { data: ratedMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('rating')
      .not('rating', 'is', null);

    const { count: ragMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('rag_used', true);

    // Calculate averages
    const avgRating = ratedMessages && ratedMessages.length > 0
      ? ratedMessages.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMessages.length
      : null;

    // Get recent feedback
    const { data: recentFeedback } = await supabaseAdmin
      .from('chat_messages')
      .select('id, content, rating, feedback, model_name, created_at')
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      summary: {
        totalMessages: totalMessages || 0,
        totalSessions: totalSessions || 0,
        totalRated: ratedMessages?.length || 0,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(2)) : null,
        ragUsageCount: ragMessages || 0,
      },
      dailyStats,
      modelStats,
      recentFeedback: recentFeedback || [],
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
