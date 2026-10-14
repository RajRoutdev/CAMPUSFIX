import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

/**
 * Trusted demo accounts for middleware role resolution.
 * This is a lightweight lookup — the full DEMO_ACCOUNTS module
 * cannot be imported here because middleware runs in the Edge runtime.
 */
const DEMO_ACCOUNT_ROLES: Record<string, 'student' | 'staff' | 'admin'> = {
  'e1111111-1111-1111-1111-111111111111': 'student',
  'e2222222-2222-2222-2222-222222222222': 'staff',
  'e3333333-3333-3333-3333-333333333333': 'admin',
};

const DEMO_EMAIL_ROLES: Record<string, 'student' | 'staff' | 'admin'> = {
  'student@campusfix.edu': 'student',
  'staff@campusfix.edu': 'staff',
  'admin@campusfix.edu': 'admin',
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let userRole: 'student' | 'staff' | 'admin' | null = null;
  let isAuthenticated = false;

  // 1. Check Demo Session Cookie — resolve role from TRUSTED lookup, not cookie payload
  const demoCookie = request.cookies.get('campusfix_session')?.value;
  if (demoCookie) {
    try {
      const parsed = JSON.parse(demoCookie);
      if (parsed?.userId && parsed?.email) {
        // SECURITY: Resolve role from trusted server-side mapping
        const trustedRoleById = DEMO_ACCOUNT_ROLES[parsed.userId];
        const trustedRoleByEmail = DEMO_EMAIL_ROLES[parsed.email?.toLowerCase()];

        if (trustedRoleById && trustedRoleById === trustedRoleByEmail) {
          userRole = trustedRoleById;
          isAuthenticated = true;
        }
        // If userId/email don't match a known demo account, do NOT authenticate
      }
    } catch {
      // invalid cookie
    }
  }

  // 2. Try Supabase Auth Session (if not already authenticated via demo)
  if (!isAuthenticated) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      try {
        const supabase = createServerClient<Database>(url, anonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          isAuthenticated = true;
          // SECURITY: Resolve role from trusted email-to-role mapping
          // rather than naive email string matching
          const emailLower = (user.email || '').toLowerCase();
          const knownRole = DEMO_EMAIL_ROLES[emailLower];
          if (knownRole) {
            userRole = knownRole;
          } else {
            // For non-demo Supabase users, default to student
            // (API routes will enforce actual profile role from DB)
            userRole = 'student';
          }
        }
      } catch {
        // Supabase unavailable or using placeholder configuration
      }
    }
  }

  // 3. Route Access Guards

  // Portal-specific login pages: allow access when unauthenticated
  if (
    pathname === '/login' ||
    pathname === '/student/login' ||
    pathname === '/staff/login' ||
    pathname === '/admin/login'
  ) {
    if (isAuthenticated && userRole) {
      const destination =
        userRole === 'admin'
          ? '/admin/dashboard'
          : userRole === 'staff'
          ? '/staff/dashboard'
          : '/student/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  // Student portal routes
  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/student/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Only students can access the student portal
    if (userRole !== 'student') {
      const destination =
        userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  // Staff portal routes
  if (pathname.startsWith('/staff')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/staff/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (userRole === 'admin') {
      // Admins can also view staff portal (they have higher privileges)
      return response;
    }
    return response;
  }

  // Admin portal routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (userRole === 'staff') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
