/**
 * API route for admin payment recording
 * Secured with owner-only access, validation, and rate limiting
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  validateBody,
  applyRateLimit,
  sanitizeError,
  successResponse,
  errorResponse,
} from '@/lib/security/api-utils';
import { paymentSchema } from '@/lib/security/validation';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(req, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

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

    // Verify authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return errorResponse('Unauthorized', 401, rateLimitResult.headers);
    }

    // Verify owner role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!user || user.role !== 'owner') {
      return errorResponse('Forbidden - Owner access required', 403, rateLimitResult.headers);
    }

    // Validate request body
    const bodyResult = await validateBody(req, paymentSchema);
    if (bodyResult.error) return bodyResult.error;

    const { userId, amount } = bodyResult.data;

    // Insert payment
    const { data, error } = await supabase
      .from('admin_payments')
      .insert({
        user_id: userId,
        amount: amount,
        created_by: authUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, rateLimitResult.headers);
  } catch (error) {
    console.error('Error in payments API:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}
