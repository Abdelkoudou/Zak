import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyOwner } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const PER_PAGE = 1000;
const MAX_PAGES = 20; // Safety guard: max 20,000 users

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Fetch all auth users with pagination to avoid truncation
    const allUsers: any[] = [];
    let page = 1;
    let truncated = false;

    while (page <= MAX_PAGES) {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: PER_PAGE,
        });

      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 500 },
        );
      }

      allUsers.push(...authData.users);

      // If we got fewer than PER_PAGE, we've reached the last page
      if (authData.users.length < PER_PAGE) {
        break;
      }

      page++;

      // Safety guard reached
      if (page > MAX_PAGES) {
        console.warn(
          `[unconfirmed-users] Reached max page limit (${MAX_PAGES}). Results may be truncated. Total fetched: ${allUsers.length}`,
        );
        truncated = true;
      }
    }

    // Filter to unconfirmed users
    const unconfirmedAuthUsers = allUsers.filter(
      (u) => !u.email_confirmed_at,
    );

    if (unconfirmedAuthUsers.length === 0) {
      return NextResponse.json({ data: [], truncated });
    }

    // Fetch public.users data for these users — with error handling
    const userIds = unconfirmedAuthUsers.map((u) => u.id);
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_paid, subscription_expires_at, year_of_study, speciality, created_at')
      .in('id', userIds);

    if (publicError) {
      console.error('Error fetching public user data:', publicError);
      return NextResponse.json(
        { error: `Erreur lors de la récupération des données utilisateur: ${publicError.message}` },
        { status: 500 },
      );
    }

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

    return NextResponse.json({ data: merged, truncated });
  } catch (error) {
    console.error('Fetch unconfirmed users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
