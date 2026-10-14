import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Profile } from '@/types/models';

export async function getCurrentUser(): Promise<{
  userId: string | null;
  profile: Profile | null;
  error: string | null;
}> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { userId: null, profile: null, error: authError?.message || 'Not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        userId: user.id,
        profile: null,
        error: profileError?.message || 'Profile record not found',
      };
    }

    return { userId: user.id, profile: profile as Profile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown auth error';
    return { userId: null, profile: null, error: message };
  }
}
