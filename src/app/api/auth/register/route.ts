import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { registerUser, findUserByEmail } from '@/lib/auth/user-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDatabaseClient } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const college_id = typeof body.college_id === 'string' && body.college_id.trim()
      ? body.college_id.trim()
      : '11111111-1111-1111-1111-111111111111'; // Default: Apex Institute of Technology

    // 1. Validation
    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // 2. Check if user already exists
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // 3. MANDATORY SECURITY REQUIREMENT (AGENTS.md):
    // Public self-registration MUST strictly assign role = 'student' on the server.
    const trustedRole = 'student';

    let supabaseUserId: string | null = null;

    // 4. Attempt live Supabase Auth creation if configured (with timeout to prevent lagging)
    try {
      const supabase = createServerSupabaseClient();
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: trustedRole,
            college_id,
          },
        },
      });

      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
        setTimeout(
          () => resolve({ data: { user: null }, error: new Error('Supabase Auth timeout') }),
          1500
        )
      );

      const { data: authData, error: authError } = await Promise.race([
        signUpPromise,
        timeoutPromise,
      ]);

      if (!authError && authData?.user) {
        supabaseUserId = authData.user.id;
        // Insert or upsert profile using getDatabaseClient() to bypass PostgreSQL RLS on server
        const db = getDatabaseClient();
        await db.from('profiles').upsert({
          id: authData.user.id,
          name,
          email,
          role: trustedRole,
          college_id,
        }, { onConflict: 'id' });
      }
    } catch {
      // Supabase is offline or tables are not yet initialized; proceed with local store
    }

    // 5. Register in User Store
    const newUser = registerUser({
      email,
      password,
      name,
      role: trustedRole,
      college_id,
    });

    if (supabaseUserId) {
      newUser.id = supabaseUserId;
    }

    // 6. Set Session Cookies
    const sessionPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      college_id: newUser.college_id,
      department_id: null,
      role: trustedRole,
    };

    const cookieStore = cookies();
    cookieStore.set('campusfix_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    cookieStore.set('campusfix_logged_in', '1', {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    cookieStore.set('campusfix_role', trustedRole, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({
      success: true,
      role: trustedRole,
      user: {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: trustedRole,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
