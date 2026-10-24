import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    // 1. Revoke Supabase Auth session if active
    try {
      const supabase = createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase client may be unconfigured in dev/offline mode
    }

    // 2. Clear application session cookies
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
