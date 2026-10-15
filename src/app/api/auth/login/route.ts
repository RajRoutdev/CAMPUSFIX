import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth/demo-accounts';
import { validateAccessCode, PortalType } from '@/lib/auth/access-codes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const portal = typeof body.portal === 'string' ? body.portal.trim().toLowerCase() : '';
    const accessCode = typeof body.accessCode === 'string' ? body.accessCode : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1. Validate portal type
    const validPortals: PortalType[] = ['student', 'staff', 'admin'];
    const portalType: PortalType = validPortals.includes(portal as PortalType)
      ? (portal as PortalType)
      : 'student';

    // 2. Verify credentials against known demo accounts
    const demoUser = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email);

    if (!demoUser || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. CRITICAL SECURITY CHECK: Verify the user's TRUSTED database role
    //    matches the portal they are trying to access.
    //    Never trust client-supplied role — use the role from DEMO_ACCOUNTS.
    const trustedRole = demoUser.role;

    if (portalType === 'admin' && trustedRole !== 'admin') {
      return NextResponse.json(
        { error: 'Your account does not have administrator privileges' },
        { status: 403 }
      );
    }

    if (portalType === 'staff' && trustedRole !== 'staff') {
      return NextResponse.json(
        { error: 'Your account does not have staff privileges' },
        { status: 403 }
      );
    }

    if (portalType === 'student' && trustedRole !== 'student') {
      // Staff/admin logging in via student portal — redirect them to their portal
      return NextResponse.json(
        { error: `Please use the ${trustedRole} portal to sign in` },
        { status: 403 }
      );
    }

    // 4. Validate access code for staff and admin portals
    if (portalType === 'staff' || portalType === 'admin') {
      const codeResult = validateAccessCode(portalType, accessCode);
      if (!codeResult.valid) {
        return NextResponse.json(
          { error: codeResult.reason || 'Invalid access code' },
          { status: 403 }
        );
      }
    }

    // 5. Set secure session cookie
    //    The cookie stores userId and email for identification.
    //    The ROLE is NOT stored in the cookie — it will be resolved
    //    from trusted DEMO_ACCOUNTS in getCurrentUser().
    const sessionPayload = {
      userId: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      college_id: demoUser.college_id,
      department_id: demoUser.departmentName ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
    };

    const cookieStore = cookies();
    cookieStore.set('campusfix_session', JSON.stringify(sessionPayload), {
      httpOnly: true,   // Prevent client-side JavaScript access
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Client-side UI indicator (non-sensitive boolean flag)
    cookieStore.set('campusfix_logged_in', '1', {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Client-side UI role indicator (non-sensitive role for instant navigation scoping)
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
        userId: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: trustedRole,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
