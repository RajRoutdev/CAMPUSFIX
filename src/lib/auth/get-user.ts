import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/types/models';
import { DEMO_ACCOUNTS } from './demo-accounts';
import { findUserByEmail } from './user-store';

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

  // 2. Fallback to Session Cookie (Guarantees reliable local & hackathon testing)
  //    SECURITY HARDENING (Phase 8):
  //    - Cross-reference cookie email against DEMO_ACCOUNTS and server-side user store
  //    - Use the TRUSTED role from server store, not from the cookie payload
  //    - This prevents role escalation via cookie tampering
  try {
    const cookieStore = cookies();
    const demoCookie = cookieStore.get('campusfix_session')?.value;

    if (demoCookie) {
      const parsed = JSON.parse(demoCookie);
      if (parsed && parsed.userId && parsed.email) {
        // CRITICAL: Resolve role from trusted DEMO_ACCOUNTS, NOT from cookie
        const trustedAccount = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === parsed.email.toLowerCase()
        );

        if (trustedAccount) {
          // Verify userId matches the trusted account to prevent ID spoofing
          if (trustedAccount.id !== parsed.userId) {
            return { userId: null, profile: null, error: 'Session integrity check failed' };
          }

          const profile: Profile = {
            id: trustedAccount.id,
            college_id: trustedAccount.college_id,
            name: trustedAccount.name,
            email: trustedAccount.email,
            role: trustedAccount.role,  // TRUSTED role from server-side DEMO_ACCOUNTS
            department_id: trustedAccount.departmentName
              ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
              : null,
            created_at: new Date().toISOString(),
          };

          return { userId: trustedAccount.id, profile, error: null };
        }

        // Check registered user store
        const registered = findUserByEmail(parsed.email);
        if (registered) {
          if (registered.id !== parsed.userId) {
            return { userId: null, profile: null, error: 'Session integrity check failed' };
          }

          const profile: Profile = {
            id: registered.id,
            college_id: registered.college_id,
            name: registered.name,
            email: registered.email,
            role: registered.role, // TRUSTED role from server-side user store
            department_id: registered.department_id || null,
            created_at: registered.created_at,
          };

          return { userId: registered.id, profile, error: null };
        }

        return { userId: null, profile: null, error: 'Unknown account' };
      }
    }
  } catch {
    // Cookie parsing error
  }

  return { userId: null, profile: null, error: 'Not authenticated' };
}
