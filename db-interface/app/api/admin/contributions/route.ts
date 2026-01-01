/**
 * API route for admin contribution analytics
 * Secured with owner-only access and rate limiting
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  applyRateLimit,
  sanitizeError,
  successResponse,
  errorResponse,
} from '@/lib/security/api-utils';
import { uuidSchema } from '@/lib/security/validation';

// Query parameter validation schemas
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional();
const modeSchema = z.enum(['payable']).optional();

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req);
    if (rateLimitResult.error) return rateLimitResult.error;

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

    // Verify user is authenticated
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

    // Validate and parse query parameters
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const userIdParam = searchParams.get('userId');
    const modeParam = searchParams.get('mode');

    // Validate date parameters
    if (startDateParam) {
      const startResult = dateSchema.safeParse(startDateParam);
      if (!startResult.success) {
        return errorResponse('Invalid startDate format', 400, rateLimitResult.headers);
      }
    }

    if (endDateParam) {
      const endResult = dateSchema.safeParse(endDateParam);
      if (!endResult.success) {
        return errorResponse('Invalid endDate format', 400, rateLimitResult.headers);
      }
    }

    // Validate userId if provided
    if (userIdParam) {
      const userIdResult = uuidSchema.safeParse(userIdParam);
      if (!userIdResult.success) {
        return errorResponse('Invalid userId format', 400, rateLimitResult.headers);
      }

      // Get detailed breakdown for specific user
      const { data, error } = await supabase.rpc('get_admin_contribution_details', {
        admin_user_id: userIdParam,
        start_date: startDateParam || null,
        end_date: endDateParam || null,
      });

      if (error) throw error;
      return successResponse(data, rateLimitResult.headers);
    }

    // Validate mode if provided
    if (modeParam) {
      const modeResult = modeSchema.safeParse(modeParam);
      if (!modeResult.success) {
        return errorResponse('Invalid mode parameter', 400, rateLimitResult.headers);
      }

      if (modeParam === 'payable') {
        const { data, error } = await supabase.rpc('get_admin_payable_stats');
        if (error) throw error;
        return successResponse(data, rateLimitResult.headers);
      }
    }

    // Get summary by period
    const { data, error } = await supabase.rpc('get_admin_contributions_by_period', {
      start_date: startDateParam || null,
      end_date: endDateParam || null,
    });

    if (error) throw error;
    return successResponse(data, rateLimitResult.headers);
  } catch (error) {
    console.error('Error in contributions API:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}
