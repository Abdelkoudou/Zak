import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Create Supabase client with service role for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // No-op for GET requests
          },
          remove(name: string, options: CookieOptions) {
            // No-op for GET requests
          },
        },
      }
    );

    // Verify user is authenticated and is owner
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can view contribution analytics' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // If userId is provided, get detailed breakdown
    if (userId) {
      const { data, error } = await supabase.rpc(
        'get_admin_contribution_details',
        {
          admin_user_id: userId,
          start_date: startDate || null,
          end_date: endDate || null,
        }
      );

      if (error) {
        console.error('Error fetching contribution details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // Otherwise, get summary by period
    const { data, error } = await supabase.rpc(
      'get_admin_contributions_by_period',
      {
        start_date: startDate || null,
        end_date: endDate || null,
      }
    );

    if (error) {
      console.error('Error fetching contributions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in contributions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
