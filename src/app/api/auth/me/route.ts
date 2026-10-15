import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId, profile, error } = await getCurrentUser();

    if (error || !userId || !profile) {
      return NextResponse.json({
        authenticated: false,
        role: null,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      role: profile.role,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        college_id: profile.college_id,
        department_id: profile.department_id,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session verification failed';
    return NextResponse.json(
      { authenticated: false, role: null, user: null, error: message },
      { status: 500 }
    );
  }
}
