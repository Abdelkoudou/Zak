/**
 * Shared API utilities for authentication, validation, and error handling
 * Provides consistent security patterns across all API routes
 */
import { NextResponse } from 'next/server';
import { ZodError, ZodSchema, ZodIssue } from 'zod';
import { supabase } from '@/lib/supabase';
import { verifyAdminUser, verifyOwner } from '@/lib/supabase-admin';
import { checkRateLimit, getRateLimitHeaders } from './rate-limit';

// ============ Error Handling ============

/**
 * Sanitize error messages to prevent information leakage
 * Only returns safe, generic messages to clients
 */
export function sanitizeError(error: unknown): string {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues as ZodIssue[];
    const messages = issues.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    });
    return `Validation error: ${messages.join(', ')}`;
  }

  // Handle known safe error messages
  if (error instanceof Error) {
    const safePatterns = [
      'Not authenticated',
      'Unauthorized',
      'Forbidden',
      'Not found',
      'Rate limit exceeded',
      'Invalid',
      'required',
    ];

    if (safePatterns.some((pattern) => error.message.includes(pattern))) {
      return error.message;
    }

    // Handle PostgreSQL unique constraint violations
    if (error.message.includes('duplicate key') ||
      error.message.includes('unique constraint') ||
      error.message.includes('questions_unique_per_exam')) {
      return 'Une question avec ce numéro existe déjà pour ce module/examen. Veuillez utiliser un numéro différent.';
    }

    // Handle PostgreSQL foreign key violations
    if (error.message.includes('foreign key constraint')) {
      return 'Référence invalide. Veuillez vérifier les données saisies.';
    }
  }

  // Default generic message for unknown errors
  // DEBUG: Exposing full error to diagnose the issue
  return `An unexpected error occurred: ${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json({ success: true, data }, { headers });
}

// ============ Request Validation ============

/**
 * Validate request body against a Zod schema
 * Returns parsed data or error response
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        error: errorResponse(sanitizeError(result.error), 400),
      };
    }

    return { data: result.data };
  } catch {
    return {
      error: errorResponse('Invalid JSON body', 400),
    };
  }
}

/**
 * Validate query parameter against a Zod schema
 */
export function validateParam<T>(
  value: string | null,
  schema: ZodSchema<T>,
  paramName: string
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  if (value === null) {
    return {
      error: errorResponse(`${paramName} is required`, 400),
    };
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      error: errorResponse(`Invalid ${paramName}`, 400),
    };
  }

  return { data: result.data };
}

// ============ Authentication ============

/**
 * Authenticate user from Authorization header
 * Returns user object or error response
 */
export async function authenticateRequest(
  request: Request
): Promise<
  { user: { id: string }; error?: never } | { user?: never; error: NextResponse }
> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return {
      error: errorResponse('Unauthorized - No auth token', 401),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'Bearer') {
    return {
      error: errorResponse('Unauthorized - Invalid token format', 401),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      error: errorResponse('Unauthorized - Invalid token', 401),
    };
  }

  return { user };
}

// ============ Authorization ============

/**
 * Verify user has admin role (owner, admin, or manager)
 */
export async function requireAdmin(
  userId: string
): Promise<{ role: string; error?: never } | { role?: never; error: NextResponse }> {
  const { isAdmin, role } = await verifyAdminUser(userId);

  if (!isAdmin) {
    return {
      error: errorResponse('Forbidden - Admin access required', 403),
    };
  }

  return { role: role! };
}

/**
 * Verify user has owner role
 */
export async function requireOwner(
  userId: string
): Promise<{ error?: never } | { error: NextResponse }> {
  const { isOwner } = await verifyOwner(userId);

  if (!isOwner) {
    return {
      error: errorResponse('Forbidden - Owner access required', 403),
    };
  }

  return {};
}

// ============ Rate Limiting ============

type RateLimitType = 'default' | 'auth' | 'export' | 'write';

/**
 * Apply rate limiting to request
 * Returns error response if rate limited
 */
export async function applyRateLimit(
  request: Request,
  type: RateLimitType = 'default'
): Promise<{ error?: NextResponse; headers: Record<string, string> }> {
  const { rateLimited, remaining } = await checkRateLimit(request, type);
  const headers = getRateLimitHeaders(remaining, type);

  if (rateLimited) {
    return {
      error: errorResponse('Rate limit exceeded. Please try again later.', 429, headers),
      headers,
    };
  }

  return { headers };
}

// ============ Combined Middleware ============

/**
 * Combined authentication and authorization check
 * Use for routes requiring admin access
 */
export async function requireAuthenticatedAdmin(
  request: Request
): Promise<
  | { user: { id: string }; role: string; error?: never }
  | { user?: never; role?: never; error: NextResponse }
> {
  const authResult = await authenticateRequest(request);
  if (authResult.error) return authResult;

  const adminResult = await requireAdmin(authResult.user.id);
  if (adminResult.error) return adminResult;

  return { user: authResult.user, role: adminResult.role };
}

/**
 * Combined authentication and owner check
 * Use for routes requiring owner access
 */
export async function requireAuthenticatedOwner(
  request: Request
): Promise<
  | { user: { id: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const authResult = await authenticateRequest(request);
  if (authResult.error) return authResult;

  const ownerResult = await requireOwner(authResult.user.id);
  if (ownerResult.error) return ownerResult;

  return { user: authResult.user };
}
