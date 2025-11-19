// Middleware to protect admin routes
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  } = await supabase.auth.getSession();

  // If not authenticated, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if user has admin role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || !['owner', 'admin', 'manager'].includes(user.role)) {
    // User is authenticated but not admin - redirect to login with error
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Protect these routes
export const config = {
  matcher: [
    '/questions/:path*',
    '/resources/:path*',
    '/modules/:path*',
    '/history/:path*',
    // Add other admin routes here
  ],
};
