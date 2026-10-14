import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let userRole: 'student' | 'staff' | 'admin' | null = null;
  let isAuthenticated = false;

  // 1. Check Demo Session Cookie (Fast & deterministic)
  const demoCookie = request.cookies.get('campusfix_session')?.value;
  if (demoCookie) {
    try {
      const parsed = JSON.parse(demoCookie);
      if (parsed?.role) {
        userRole = parsed.role;
        isAuthenticated = true;
      }
    } catch {
      // invalid cookie
    }
  }

  // 2. Try Supabase Auth Session
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
        const email = user.email || '';
        if (email.includes('admin')) {
          userRole = 'admin';
        } else if (email.includes('staff')) {
          userRole = 'staff';
        } else {
          userRole = 'student';
        }
      }
    } catch {
      // Supabase unavailable or using placeholder configuration
    }
  }

  // 3. Route Access Guards

  // Login page: redirect if already authenticated
  if (pathname === '/login') {
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
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Staff portal routes
  if (pathname.startsWith('/staff')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    return response;
  }

  // Admin portal routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
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
