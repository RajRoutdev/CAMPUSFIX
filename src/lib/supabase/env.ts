/**
 * Validates and retrieves Supabase environment variables safely.
 * Enforces strict separation between browser-accessible and server-only keys.
 */

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Please check your .env.local file or environment configuration.'
    );
  }

  return { url, anonKey };
}

export function getServerSupabaseEnv() {
  // Ensure this function is never called in the browser
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: getServerSupabaseEnv() cannot be accessed from client-side code.');
  }

  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. ' +
      'This secret is required for server-side administrative actions and must not be exposed to the browser.'
    );
  }

  return { url, serviceRoleKey };
}
