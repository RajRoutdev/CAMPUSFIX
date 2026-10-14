import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth/demo-accounts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const demoUser = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email);

    if (!demoUser || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      name: demoUser.name,
      college_id: demoUser.college_id,
      department_id: demoUser.departmentName ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
    };

    // Set cookie on server
    const cookieStore = cookies();
    cookieStore.set('campusfix_session', JSON.stringify(sessionPayload), {
      httpOnly: false, // Accessible to client and edge middleware
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      role: demoUser.role,
      user: sessionPayload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
