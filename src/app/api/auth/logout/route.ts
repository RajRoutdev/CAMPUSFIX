import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete('campusfix_session');
    cookieStore.delete('campusfix_logged_in');
    cookieStore.delete('campusfix_role');

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
