import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with explicit error handling
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
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

    // Resend confirmation email (resend will return its own error if user not found)
    const { error: resendError } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
    });

    if (resendError) {
      console.error('Error resending confirmation:', resendError);

      // Map known error patterns to appropriate status codes
      const message = resendError.message.toLowerCase();
      const status =
        message.includes('not found') || message.includes('no user')
          ? 404
          : message.includes('invalid') || message.includes('validation')
            ? 422
            : 500;

      return NextResponse.json(
        { error: `Erreur lors du renvoi: ${resendError.message}` },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email de confirmation renvoyé avec succès',
    });
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
