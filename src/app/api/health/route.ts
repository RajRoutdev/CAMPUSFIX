import { NextResponse } from 'next/server';
import { getPublicSupabaseEnv } from '@/lib/supabase/env';

export async function GET() {
  const timestamp = new Date().toISOString();

  let envStatus = 'valid';
  let envError: string | null = null;

  try {
    getPublicSupabaseEnv();
  } catch (err: unknown) {
    envStatus = 'missing_or_invalid';
    envError = err instanceof Error ? err.message : 'Unknown env error';
  }

  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    status: 'ok',
    phase: 'Phase 1 — Foundation',
    timestamp,
    environment: {
      publicConfigured: envStatus === 'valid',
      hasServiceRoleKey,
      hasGeminiKey,
      envError,
    },
    tables: [
      'colleges',
      'departments',
      'locations',
      'profiles',
      'issues',
      'issue_images',
      'issue_matches',
      'activity_logs',
    ],
    rolesSupported: ['student', 'staff', 'admin'],
    storageBucket: 'campusfix-images',
  });
}
