import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies();

        // Create Supabase client
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // No-op
                    },
                    remove(name: string, options: CookieOptions) {
                        // No-op
                    },
                },
            }
        );

        // Verify authentication and owner role
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();

        if (!user || user.role !== 'owner') {
            return NextResponse.json(
                { error: 'Only owners can record payments' },
                { status: 403 }
            );
        }

        // Get body parameters
        const body = await req.json();
        const { userId, amount } = body;

        if (!userId || !amount) {
            return NextResponse.json(
                { error: 'Missing required parameters: userId, amount' },
                { status: 400 }
            );
        }

        // Insert payment
        const { data, error } = await supabase
            .from('admin_payments')
            .insert({
                user_id: userId,
                amount: amount,
                created_by: authUser.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error recording payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in payments API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
