import { createAdminClient } from './admin';
import { createServerSupabaseClient } from './server';

/**
 * Returns an appropriate Supabase client for Next.js server-side API routes.
 * 
 * SECURITY & PERMISSIONS:
 * - If SUPABASE_SERVICE_ROLE_KEY is configured, returns the service-role client (createAdminClient).
 *   This client bypasses PostgreSQL RLS, allowing server-authenticated and validated operations
 *   to read and write to the database.
 * - Otherwise falls back to createServerSupabaseClient().
 * 
 * MUST ONLY be called within Next.js Server Components, API routes, or server actions.
 */
export function getDatabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: getDatabaseClient() cannot be executed in the browser.');
  }

  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (hasServiceKey) {
    try {
      return createAdminClient();
    } catch {
      // Fallback if service client initialization fails
    }
  }

  return createServerSupabaseClient();
}
