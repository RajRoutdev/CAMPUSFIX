import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/types/models';
import { DEMO_ACCOUNTS } from './demo-accounts';

export async function getCurrentUser(): Promise<{
  userId: string | null;
  profile: Profile | null;
  error: string | null;
}> {
  // 1. Try Live Supabase Auth Session
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        return { userId: user.id, profile: profile as Profile, error: null };
      }
    }
  } catch {
    // Supabase unavailable or using placeholder configuration
  }

  // 2. Fallback to Demo Session Cookie (Guarantees reliable local & hackathon testing)
  try {
    const cookieStore = cookies();
    const demoCookie = cookieStore.get('campusfix_session')?.value;

    if (demoCookie) {
      const parsed = JSON.parse(demoCookie);
      if (parsed && parsed.userId && parsed.role) {
        const demoAccount = DEMO_ACCOUNTS.find((a) => a.email === parsed.email);
        const profile: Profile = {
          id: parsed.userId,
          college_id: parsed.college_id || '11111111-1111-1111-1111-111111111111',
          name: parsed.name || demoAccount?.label || 'Demo User',
          email: parsed.email || 'student@campusfix.edu',
          role: parsed.role,
          department_id: parsed.department_id || null,
          created_at: new Date().toISOString(),
        };

        return { userId: parsed.userId, profile, error: null };
      }
    }
  } catch {
    // Cookie parsing error
  }

  return { userId: null, profile: null, error: 'Not authenticated' };
}
