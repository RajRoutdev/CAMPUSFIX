import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getServerSupabaseEnv } from './env';

/**
 * Creates an administrative Supabase client using the service role key.
 * 
 * SECURITY MANDATE (PRD & AGENTS.md):
 * - Service role client bypasses RLS and has full administrative database privileges.
 * - This function MUST ONLY be called within secure Next.js server-side routes or server actions.
 * - This function must NEVER be exported or referenced in client components.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: Supabase service role client cannot be executed in the browser.');
  }

  const { url, serviceRoleKey } = getServerSupabaseEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
