import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth/demo-accounts';
import { validateAccessCode, PortalType } from '@/lib/auth/access-codes';
import { verifyUserCredentials, registerUser } from '@/lib/auth/user-store';

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

    // 2. Verify credentials against known demo accounts or registered user store
    let activeUser: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'staff' | 'admin';
      college_id: string;
      department_id?: string | null;
    } | null = null;

    const demoUser = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email);
    if (demoUser && password === DEMO_PASSWORD) {
      activeUser = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        college_id: demoUser.college_id,
        department_id: demoUser.departmentName ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
      };
    } else {
      const verified = verifyUserCredentials(email, password);
      if (verified) {
        activeUser = {
          id: verified.id,
          email: verified.email,
          name: verified.name,
          role: verified.role,
          college_id: verified.college_id,
          department_id: verified.department_id || null,
        };
      } else if (portalType === 'staff' || portalType === 'admin') {
        // Staff/Admin access code onboarding:
        // If an authorized staff or admin enters their credentials with the valid access code
        const codeCheck = validateAccessCode(portalType, accessCode);
        if (codeCheck.valid && password.length >= 6) {
          const registered = registerUser({
            email,
            password,
            name: email.split('@')[0],
            role: portalType,
          });
          activeUser = {
            id: registered.id,
            email: registered.email,
            name: registered.name,
            role: registered.role,
            college_id: registered.college_id,
            department_id: registered.department_id || null,
          };
        }
      }
    }

    if (!activeUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. CRITICAL SECURITY CHECK: Verify the user's TRUSTED database role
    //    matches the portal they are trying to access.
    //    Never trust client-supplied role — use the role from DEMO_ACCOUNTS.
    const trustedRole = activeUser.role;

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

    // 5. Set secure httpOnly session cookie
    const sessionPayload = {
      userId: activeUser.id,
      email: activeUser.email,
      name: activeUser.name,
      college_id: activeUser.college_id,
      department_id: activeUser.department_id || null,
      role: trustedRole,
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
        userId: activeUser.id,
        email: activeUser.email,
        name: activeUser.name,
        role: trustedRole,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
