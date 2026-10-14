/**
 * Phase 1 — Foundation Verification Script
 * Validates files, schema structures, environment isolation, and role models.
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

console.log('====================================================');
console.log('CampusFix Phase 1 — Foundation Verification');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Check critical files
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'next.config.mjs',
  '.gitignore',
  '.env.example',
  '.env.local',
  'supabase/migrations/20261014000000_phase1_foundation.sql',
  'supabase/seed.sql',
  'src/middleware.ts',
  'src/types/database.types.ts',
  'src/types/models.ts',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/supabase/admin.ts',
  'src/lib/supabase/env.ts',
  'src/lib/auth/demo-accounts.ts',
  'src/lib/auth/get-user.ts',
  'src/lib/utils.ts',
  'src/app/globals.css',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/student/dashboard/page.tsx',
  'src/app/student/report/page.tsx',
  'src/app/staff/dashboard/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/api/health/route.ts',
];

console.log('1. Checking Required Files...');
for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  assert(fs.existsSync(filePath), `File exists: ${file}`);
}

// 2. Check Migration SQL completeness
console.log('\n2. Checking Database Migration Schema...');
const sqlContent = fs.readFileSync(path.join(rootDir, 'supabase/migrations/20261014000000_phase1_foundation.sql'), 'utf8');

const requiredTables = [
  'colleges',
  'departments',
  'locations',
  'profiles',
  'issues',
  'issue_images',
  'issue_matches',
  'activity_logs',
];

for (const table of requiredTables) {
  assert(sqlContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `Table defined: public.${table}`);
  assert(sqlContent.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `RLS enabled on: public.${table}`);
}

assert(sqlContent.includes('campusfix-images'), 'Storage bucket "campusfix-images" configured');
assert(sqlContent.includes('ticket_number_seq'), 'Ticket number sequence configured (CF-xxxx)');
assert(sqlContent.includes('GRANT USAGE, SELECT ON SEQUENCE public.ticket_number_seq TO authenticated, anon;'), 'Sequence permissions granted to authenticated users');
assert(sqlContent.includes('SET search_path = public, pg_temp;'), 'Security search_path set on functions');
assert(sqlContent.includes("status NOT IN ('VERIFIED', 'CLOSED')"), 'Non-admin status transitions restricted in RLS');
assert(sqlContent.includes("(image_type = 'resolution' AND (SELECT role FROM public.get_current_profile()) IN ('staff', 'admin'))"), 'Resolution image uploads restricted to staff/admin');

// 3. Check Security Requirements in code
console.log('\n3. Checking Security Rules...');
const adminContent = fs.readFileSync(path.join(rootDir, 'src/lib/supabase/admin.ts'), 'utf8');
assert(
  adminContent.includes('typeof window !== \'undefined\''),
  'Service role admin client blocks execution in browser environment'
);

const gitignoreContent = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
assert(gitignoreContent.includes('.env*.local'), '.gitignore protects .env*.local');
assert(gitignoreContent.includes('node_modules/'), '.gitignore excludes node_modules');

const serverContent = fs.readFileSync(path.join(rootDir, 'src/lib/supabase/server.ts'), 'utf8');
assert(serverContent.includes('getAll()') && serverContent.includes('setAll('), 'Server client uses modern getAll/setAll cookie handlers');

// 4. Check Demo Accounts and Seed Data
console.log('\n4. Checking Demo Accounts and Seed Script...');
const demoContent = fs.readFileSync(path.join(rootDir, 'src/lib/auth/demo-accounts.ts'), 'utf8');
assert(demoContent.includes('student@campusfix.edu'), 'Student demo account configured');
assert(demoContent.includes('staff@campusfix.edu'), 'Staff demo account configured');
assert(demoContent.includes('admin@campusfix.edu'), 'Admin demo account configured');

const seedContent = fs.readFileSync(path.join(rootDir, 'supabase/seed.sql'), 'utf8');
assert(seedContent.includes('INSERT INTO auth.users'), 'Demo users seeded into auth.users to satisfy foreign key constraint');
assert(seedContent.includes('crypt(\'Password123!\', gen_salt(\'bf\'))'), 'Demo auth users seeded with bcrypt encrypted password');

console.log('\n====================================================');
console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
