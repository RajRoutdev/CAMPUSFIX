import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { getPublicSupabaseEnv } from './env';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can be safely ignored if called from a Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Can be safely ignored if called from a Server Component
        }
      },
    },
  });
}
