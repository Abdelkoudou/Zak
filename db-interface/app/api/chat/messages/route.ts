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

// GET: Get messages for a session
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify session ownership
    const { data: chatSession } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!chatSession || chatSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add message to session
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, role, content, model, modelName, fallbackUsed, ragUsed, contextCount, responseTimeMs } = await req.json();

    if (!sessionId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify session ownership
    const { data: chatSession } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!chatSession || chatSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        model: model || null,
        model_name: modelName || null,
        fallback_used: fallbackUsed || false,
        rag_used: ragUsed || false,
        context_count: contextCount || 0,
        response_time_ms: responseTimeMs || null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Rate a message
export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, rating, feedback } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify message ownership through session
    const { data: message } = await supabaseAdmin
      .from('chat_messages')
      .select('session_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { data: chatSession } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', message.session_id)
      .single();

    if (!chatSession || chatSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updates: any = {};
    if (rating !== undefined) updates.rating = rating;
    if (feedback !== undefined) updates.feedback = feedback;

    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
