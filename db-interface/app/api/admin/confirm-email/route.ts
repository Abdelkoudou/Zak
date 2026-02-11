import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with explicit error handling
    let body: { userId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON malformé' }, { status: 400 });
    }
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Verify the caller is authenticated — robust Bearer extraction
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify the current user is an owner
    const { isOwner } = await verifyOwner(currentUser.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès refusé — réservé au propriétaire' }, { status: 403 });
    }

    // Manually confirm the user's email using the Admin API
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json(
        { error: `Erreur lors de la confirmation: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmé avec succès',
      email: updatedUser.user?.email,
      confirmedAt: updatedUser.user?.email_confirmed_at,
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
