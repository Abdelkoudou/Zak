import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verify the caller is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Fetch all auth users to check email_confirmed_at
    // The admin API uses pagination, fetch up to 1000
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Filter to unconfirmed users
    const unconfirmedAuthUsers = authData.users.filter(
      (u) => !u.email_confirmed_at
    );

    if (unconfirmedAuthUsers.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch public.users data for these users
    const userIds = unconfirmedAuthUsers.map((u) => u.id);
    const { data: publicUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_paid, subscription_expires_at, year_of_study, speciality, created_at')
      .in('id', userIds);

    // Merge auth + public data
    const merged = unconfirmedAuthUsers.map((authUser) => {
      const publicUser = publicUsers?.find((pu: Record<string, unknown>) => pu.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        fullName: publicUser?.full_name || null,
        role: publicUser?.role || 'student',
        isPaid: publicUser?.is_paid || false,
        subscriptionExpiresAt: publicUser?.subscription_expires_at || null,
        yearOfStudy: publicUser?.year_of_study || null,
        speciality: publicUser?.speciality || null,
        confirmationSentAt: authUser.confirmation_sent_at || null,
        createdAt: authUser.created_at,
      };
    });

    // Sort: paid users first, then by created_at desc
    merged.sort((a, b) => {
      if (a.isPaid && !b.isPaid) return -1;
      if (!a.isPaid && b.isPaid) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ data: merged });
  } catch (error) {
    console.error('Fetch unconfirmed users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
