import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Get the current user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify the current user is an owner or admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (!adminUser || !['owner', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Check if target user exists and is not an owner
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (targetUser.role === 'owner') {
      return NextResponse.json({ error: 'Impossible de supprimer un owner' }, { status: 403 });
    }

    // 1. Delete device sessions
    await supabaseAdmin
      .from('device_sessions')
      .delete()
      .eq('user_id', userId);

    // 2. Delete saved questions
    await supabaseAdmin
      .from('saved_questions')
      .delete()
      .eq('user_id', userId);

    // 3. Delete test attempts
    await supabaseAdmin
      .from('test_attempts')
      .delete()
      .eq('user_id', userId);

    // 4. Delete question reports
    await supabaseAdmin
      .from('question_reports')
      .delete()
      .eq('user_id', userId);

    // 5. Delete chat sessions and messages
    const { data: chatSessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId);

    if (chatSessions && chatSessions.length > 0) {
      const sessionIds = chatSessions.map(s => s.id);
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .in('session_id', sessionIds);
      
      await supabaseAdmin
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId);
    }

    // 6. Reset activation key (make it available again)
    await supabaseAdmin
      .from('activation_keys')
      .update({
        is_used: false,
        used_by: null,
        used_at: null,
      })
      .eq('used_by', userId);

    // 7. Delete user from users table
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    // 8. Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // User data is already deleted, just log the auth error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
