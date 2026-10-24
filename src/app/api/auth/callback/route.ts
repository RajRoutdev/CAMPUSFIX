import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDatabaseClient } from '@/lib/supabase/db';
import { registerUser, findUserByEmail } from '@/lib/auth/user-store';

export const dynamic = 'force-dynamic';

const DEFAULT_COLLEGE_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Validates that redirect paths are safe relative URLs to prevent open-redirect vulnerabilities.
 */
function sanitizeRedirectTarget(target: string | null, userRole: 'student' | 'staff' | 'admin'): string {
  const fallback =
    userRole === 'admin'
      ? '/admin/dashboard'
      : userRole === 'staff'
      ? '/staff/dashboard'
      : '/student/dashboard';

  if (!target) return fallback;

  // Must be a relative path and must not start with protocol-relative '//' or backslash
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback;
  }

  // Prevent embedded protocol schemes (e.g., /test:something)
  if (target.includes(':')) {
    return fallback;
  }

  // Enforce role-based portal boundaries on redirection
  if (target.startsWith('/admin') && userRole !== 'admin') {
    return fallback;
  }
  if (target.startsWith('/staff') && userRole !== 'staff') {
    return fallback;
  }
  if (target.startsWith('/student') && userRole !== 'student') {
    return fallback;
  }

  return target;
}

interface OAuthProfile {
  id: string;
  college_id: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  department_id?: string | null;
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next');

  // Handle OAuth provider cancellation or error
  if (error) {
    const message = errorDescription || error || 'OAuth sign-in was cancelled or failed.';
    const loginUrl = new URL('/student/login', req.url);
    loginUrl.searchParams.set('error', message);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL('/student/login', req.url);
    loginUrl.searchParams.set('error', 'Missing authorization code from provider.');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
      const loginUrl = new URL('/student/login', req.url);
      loginUrl.searchParams.set(
        'error',
        exchangeError?.message || 'Failed to exchange authorization code for session.'
      );
      return NextResponse.redirect(loginUrl);
    }

    const user = data.user;
    const userEmail = (user.email || '').toLowerCase().trim();
    const db = getDatabaseClient();

    // 1. Check whether a profile already exists for this authenticated user
    let existingProfile: OAuthProfile | null = null;

    // Check by user ID first
    const { data: profileById } = await db
      .from('profiles')
      .select('id, college_id, name, email, role, department_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileById) {
      existingProfile = profileById as OAuthProfile;
    } else if (userEmail) {
      // Check if pre-provisioned by email
      const { data: profileByEmail } = await db
        .from('profiles')
        .select('id, college_id, name, email, role, department_id')
        .eq('email', userEmail)
        .maybeSingle();

      if (profileByEmail) {
        existingProfile = profileByEmail as OAuthProfile;
      }
    }

    let effectiveRole: 'student' | 'staff' | 'admin' = 'student';
    let effectiveName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      userEmail.split('@')[0] ||
      'Student';
    let effectiveCollegeId = DEFAULT_COLLEGE_ID;
    let effectiveDeptId: string | null = null;

    if (existingProfile) {
      // Retain existing verified database role for returning users
      effectiveRole = existingProfile.role;
      effectiveName = existingProfile.name || effectiveName;
      effectiveCollegeId = existingProfile.college_id || DEFAULT_COLLEGE_ID;
      effectiveDeptId = existingProfile.department_id || null;
    } else {
      // STRICT LEAST-PRIVILEGE SECURITY RULE:
      // First-time public Google OAuth sign-in strictly defaults to role = 'student'.
      // Staff or Admin access can NEVER be granted automatically via OAuth claims.
      effectiveRole = 'student';

      // Look up active college from database, or fallback to default
      const { data: activeCollege } = await db
        .from('colleges')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (activeCollege?.id) {
        effectiveCollegeId = activeCollege.id;
      }

      // Provision profile record in public.profiles table
      await db.from('profiles').upsert(
        {
          id: user.id,
          college_id: effectiveCollegeId,
          name: effectiveName,
          email: userEmail,
          role: effectiveRole,
          is_active: true,
        },
        { onConflict: 'id' }
      );

      // Also register in server user store for seamless offline/in-memory fallback
      if (userEmail && !findUserByEmail(userEmail)) {
        registerUser({
          email: userEmail,
          password: crypto.randomUUID(),
          name: effectiveName,
          role: effectiveRole,
          college_id: effectiveCollegeId,
        });
      }
    }

    // 2. Set unified CampusFix session cookies
    const sessionPayload = {
      userId: user.id,
      email: userEmail,
      name: effectiveName,
      college_id: effectiveCollegeId,
      department_id: effectiveDeptId,
      role: effectiveRole,
    };

    const cookieOptions = {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    const cookieStore = cookies();
    cookieStore.set('campusfix_session', JSON.stringify(sessionPayload), {
      ...cookieOptions,
      httpOnly: true,
    });
    cookieStore.set('campusfix_logged_in', '1', {
      ...cookieOptions,
      httpOnly: false,
    });
    cookieStore.set('campusfix_role', effectiveRole, {
      ...cookieOptions,
      httpOnly: false,
    });

    // 3. Resolve destination URL and redirect
    const sanitizedTarget = sanitizeRedirectTarget(next, effectiveRole);
    const redirectUrl = new URL(sanitizedTarget, req.url);

    const response = NextResponse.redirect(redirectUrl);

    // Also attach cookies directly to redirect response object for maximum compatibility
    response.cookies.set('campusfix_session', JSON.stringify(sessionPayload), {
      ...cookieOptions,
      httpOnly: true,
    });
    response.cookies.set('campusfix_logged_in', '1', {
      ...cookieOptions,
      httpOnly: false,
    });
    response.cookies.set('campusfix_role', effectiveRole, {
      ...cookieOptions,
      httpOnly: false,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    const loginUrl = new URL('/student/login', req.url);
    loginUrl.searchParams.set('error', message);
    return NextResponse.redirect(loginUrl);
  }
}
