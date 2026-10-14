import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { getPublicSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
