// Middleware to protect admin routes
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers following OWASP best practices
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Validate environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables');
    const errorUrl = new URL('/login', req.url);
    errorUrl.searchParams.set('error', 'configuration_error');
    return NextResponse.redirect(errorUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // If not authenticated or session error, redirect to login
  if (!session || sessionError) {
    const loginUrl = new URL('/login', req.url);
    if (sessionError) {
      loginUrl.searchParams.set('error', 'session_expired');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check if session is expired
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'session_expired');
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has admin role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // Check if route requires owner role
  const isContributionsRoute = req.nextUrl.pathname.startsWith('/contributions');
  
  if (isContributionsRoute) {
    // Only owner can access contributions
    if (!user || user.role !== 'owner') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'owner_only');
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // Other routes require admin, manager, or owner
    if (!user || !['owner', 'admin', 'manager'].includes(user.role)) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'insufficient_permissions');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Ensure security headers are on final response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Protect these routes
export const config = {
  matcher: [
    '/',
    '/questions/:path*',
    '/resources/:path*',
    '/modules/:path*',
    '/history/:path*',
    '/export/:path*',
    '/contributions/:path*',
    // Add other admin routes here
  ],
};
