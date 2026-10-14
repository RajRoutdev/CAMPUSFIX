/**
 * CampusFix Phase 8 — Security, Testing, & Deployment Hardening Verification
 *
 * Verifies:
 * 1. Separate Portal Logins & Access Codes (/student/login, /staff/login, /admin/login)
 * 2. Role escalation prevention & cookie tampering resilience
 * 3. Secret isolation (Gemini, Supabase service-role, access codes)
 * 4. Server-side API authorization & RBAC guards
 * 5. Multi-college tenant isolation guards
 * 6. Edge middleware route protection & role resolution
 * 7. Database security migrations & RLS role immutability
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('CampusFix Phase 8 — Security & Deployment Hardening Verification');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// 1. VERIFY SEPARATE PORTAL LOGIN ROUTES & ACCESS CODES
// -----------------------------------------------------------------------------
console.log('1. Verifying Separate Portal Login Routes & Access Codes...');

const studentLoginPath = path.join(rootDir, 'src/app/(auth)/student/login/page.tsx');
const staffLoginPath = path.join(rootDir, 'src/app/(auth)/staff/login/page.tsx');
const adminLoginPath = path.join(rootDir, 'src/app/(auth)/admin/login/page.tsx');
const accessCodesModulePath = path.join(rootDir, 'src/lib/auth/access-codes.ts');

test('Student portal login page exists at /student/login', () => {
  assert.ok(fs.existsSync(studentLoginPath), 'Student login page must exist');
  const content = fs.readFileSync(studentLoginPath, 'utf8');
  assert.ok(content.includes('Student Portal'), 'Must declare Student Portal title');
  assert.ok(content.includes("portal: 'student'"), 'Must authenticate with portal: student');
  assert.ok(!content.includes('staff-access-code'), 'Student login must NOT require staff access code');
  assert.ok(!content.includes('admin-access-code'), 'Student login must NOT require admin access code');
});

test('Staff portal login page exists at /staff/login with access code input', () => {
  assert.ok(fs.existsSync(staffLoginPath), 'Staff login page must exist');
  const content = fs.readFileSync(staffLoginPath, 'utf8');
  assert.ok(content.includes('Staff Portal'), 'Must declare Staff Portal title');
  assert.ok(content.includes('accessCode'), 'Must send accessCode in payload');
  assert.ok(content.includes("portal: 'staff'"), 'Must declare portal: staff');
  assert.ok(content.includes('Staff Access Code'), 'Must render Staff Access Code input label');
});

test('Admin portal login page exists at /admin/login with security code input', () => {
  assert.ok(fs.existsSync(adminLoginPath), 'Admin login page must exist');
  const content = fs.readFileSync(adminLoginPath, 'utf8');
  assert.ok(content.includes('Admin Portal'), 'Must declare Admin Portal title');
  assert.ok(content.includes('accessCode'), 'Must send security code in payload');
  assert.ok(content.includes("portal: 'admin'"), 'Must declare portal: admin');
  assert.ok(content.includes('Admin Security Code'), 'Must render Admin Security Code label');
  assert.ok(content.includes('public registration is disabled'), 'Must communicate no public registration');
});

test('Server-side access code validation module enforces portal requirements', async () => {
  assert.ok(fs.existsSync(accessCodesModulePath), 'access-codes.ts must exist');
  const { validateAccessCode } = await import('../src/lib/auth/access-codes.ts');

  // Student portal: no code required
  const studentResult = validateAccessCode('student', undefined);
  assert.strictEqual(studentResult.valid, true, 'Student portal does not require code');

  // Staff portal: requires valid code
  const staffEmpty = validateAccessCode('staff', '');
  assert.strictEqual(staffEmpty.valid, false, 'Empty code should fail for staff');
  assert.ok(staffEmpty.reason.includes('required'), 'Reason must explain code is required');

  const staffWrong = validateAccessCode('staff', 'WRONG-CODE');
  assert.strictEqual(staffWrong.valid, false, 'Invalid staff code must be rejected');

  const staffValid = validateAccessCode('staff', 'STAFF-2024');
  assert.strictEqual(staffValid.valid, true, 'Valid demo staff code must pass');

  // Admin portal: requires valid security code
  const adminEmpty = validateAccessCode('admin', '');
  assert.strictEqual(adminEmpty.valid, false, 'Empty code should fail for admin');

  const adminWrong = validateAccessCode('admin', 'WRONG-CODE');
  assert.strictEqual(adminWrong.valid, false, 'Invalid admin code must be rejected');

  const adminValid = validateAccessCode('admin', 'ADMIN-2024');
  assert.strictEqual(adminValid.valid, true, 'Valid demo admin code must pass');
});

// -----------------------------------------------------------------------------
// 2. VERIFY ROLE ESCALATION & COOKIE SECURITY
// -----------------------------------------------------------------------------
console.log('\n2. Verifying Role Escalation Prevention & Cookie Security...');

const getUserPath = path.join(rootDir, 'src/lib/auth/get-user.ts');
const loginRoutePath = path.join(rootDir, 'src/app/api/auth/login/route.ts');

test('Login route sets httpOnly: true on campusfix_session cookie', () => {
  const content = fs.readFileSync(loginRoutePath, 'utf8');
  assert.ok(content.includes('httpOnly: true'), 'campusfix_session must be httpOnly');
  assert.ok(content.includes("sameSite: 'lax'"), 'Cookie must enforce sameSite: lax');
  assert.ok(content.includes('campusfix_logged_in'), 'Non-sensitive logged_in cookie set for client UI');
});

test('Login route enforces server-side database role checks before portal entry', () => {
  const content = fs.readFileSync(loginRoutePath, 'utf8');
  assert.ok(content.includes("portalType === 'admin' && trustedRole !== 'admin'"), 'Blocks non-admins from admin portal');
  assert.ok(content.includes("portalType === 'staff' && trustedRole !== 'staff'"), 'Blocks non-staff from staff portal');
  assert.ok(content.includes("portalType === 'student' && trustedRole !== 'student'"), 'Directs staff/admin to their portal');
});

test('getCurrentUser() validates role exclusively from trusted DEMO_ACCOUNTS, never cookie payload', () => {
  const content = fs.readFileSync(getUserPath, 'utf8');
  assert.ok(content.includes('DEMO_ACCOUNTS.find'), 'Must cross-reference email with DEMO_ACCOUNTS');
  assert.ok(content.includes('trustedAccount.role'), 'Role must come from trusted account definition');
  assert.ok(!content.includes('role: parsed.role'), 'Must NEVER assign role directly from parsed.role cookie');
  assert.ok(content.includes('trustedAccount.id !== parsed.userId'), 'Must verify session integrity to prevent ID spoofing');
});

// -----------------------------------------------------------------------------
// 3. VERIFY SECRET ISOLATION (SERVER-SIDE BOUNDARIES)
// -----------------------------------------------------------------------------
console.log('\n3. Verifying Secret Isolation & Environment Protection...');

const envExamplePath = path.join(rootDir, '.env.example');
const geminiClientPath = path.join(rootDir, 'src/lib/gemini/client.ts');
const insightsRoutePath = path.join(rootDir, 'src/app/api/insights/route.ts');
const supabaseEnvPath = path.join(rootDir, 'src/lib/supabase/env.ts');

test('.env.example documents secrets without exposing real credentials', () => {
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const content = fs.readFileSync(envExamplePath, 'utf8');
  assert.ok(content.includes('NEXT_PUBLIC_SUPABASE_URL'), 'Must document public Supabase URL');
  assert.ok(content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'Must document public anon key');
  assert.ok(content.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Must document service role key');
  assert.ok(content.includes('GEMINI_API_KEY'), 'Must document Gemini key');
  assert.ok(content.includes('STAFF_ACCESS_CODE'), 'Must document staff access code');
  assert.ok(content.includes('ADMIN_ACCESS_CODE'), 'Must document admin security code');
  assert.ok(!content.includes('AIzaSy'), 'Must not contain real Google API key');
  assert.ok(!content.includes('eyJhbGciOi'), 'Must not contain real JWT service role key');
});

test('Gemini client enforces server-side execution and uses secure HTTP headers', () => {
  const content = fs.readFileSync(geminiClientPath, 'utf8');
  assert.ok(content.includes("typeof window !== 'undefined'"), 'Must block client-side browser execution');
  assert.ok(content.includes("'x-goog-api-key': apiKey"), 'Must use secure header-based authentication');
  assert.ok(!content.includes('?key=${apiKey}'), 'Must not leak API key into URL query parameter');
});

test('Insights API route uses secure header-based Gemini authentication', () => {
  const content = fs.readFileSync(insightsRoutePath, 'utf8');
  assert.ok(content.includes("'x-goog-api-key': apiKey"), 'Must authenticate via x-goog-api-key header');
  assert.ok(!content.includes('?key=${apiKey}'), 'Must not pass API key in URL');
});

test('Supabase server env forbids client-side browser access to service role key', () => {
  const content = fs.readFileSync(supabaseEnvPath, 'utf8');
  assert.ok(content.includes("typeof window !== 'undefined'"), 'Must guard getServerSupabaseEnv against window');
  assert.ok(content.includes('SECURITY VIOLATION'), 'Must throw security violation if called from browser');
});

// -----------------------------------------------------------------------------
// 4. VERIFY EDGE MIDDLEWARE ROUTE PROTECTION
// -----------------------------------------------------------------------------
console.log('\n4. Verifying Edge Middleware Route Protection...');

const middlewarePath = path.join(rootDir, 'src/middleware.ts');

test('Middleware protects student, staff, and admin routes', () => {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  assert.ok(content.includes("pathname.startsWith('/student')"), 'Guards /student routes');
  assert.ok(content.includes("pathname.startsWith('/staff')"), 'Guards /staff routes');
  assert.ok(content.includes("pathname.startsWith('/admin')"), 'Guards /admin routes');
  assert.ok(content.includes("userRole === 'student'"), 'Checks user role before allowing portal entry');
  assert.ok(content.includes("userRole === 'staff'"), 'Checks staff role');
  assert.ok(content.includes("DEMO_ACCOUNT_ROLES"), 'Uses server-side trusted account lookup');
});

test('Middleware supports dedicated login routes without infinite loops', () => {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  assert.ok(content.includes("pathname === '/student/login'"), 'Allows unauthenticated /student/login');
  assert.ok(content.includes("pathname === '/staff/login'"), 'Allows unauthenticated /staff/login');
  assert.ok(content.includes("pathname === '/admin/login'"), 'Allows unauthenticated /admin/login');
});

// -----------------------------------------------------------------------------
// 5. VERIFY SERVER-SIDE API AUTHORIZATION & RBAC GUARDS
// -----------------------------------------------------------------------------
console.log('\n5. Verifying Server-Side API Authorization & RBAC Guards...');

const statusRoutePath = path.join(rootDir, 'src/app/api/issues/[id]/status/route.ts');
const assignRoutePath = path.join(rootDir, 'src/app/api/issues/[id]/assignment/route.ts');
const resolutionRoutePath = path.join(rootDir, 'src/app/api/issues/[id]/resolution/route.ts');
const issueDetailRoutePath = path.join(rootDir, 'src/app/api/issues/[id]/route.ts');
const analyticsRoutePath = path.join(rootDir, 'src/app/api/analytics/route.ts');

test('PATCH /api/issues/[id]/status blocks students from changing ticket status', () => {
  const content = fs.readFileSync(statusRoutePath, 'utf8');
  assert.ok(content.includes("profile.role === 'student'"), 'Checks student role');
  assert.ok(content.includes('403'), 'Returns 403 Forbidden for students');
});

test('PATCH /api/issues/[id]/status limits staff to starting work (IN_PROGRESS)', () => {
  const content = fs.readFileSync(statusRoutePath, 'utf8');
  assert.ok(content.includes("profile.role === 'staff'"), 'Checks staff role');
  assert.ok(content.includes("newStatus === 'IN_PROGRESS'"), 'Staff can only transition to IN_PROGRESS');
  assert.ok(content.includes('Resolution proof upload is required'), 'Enforces proof requirement for resolution');
});

test('PATCH /api/issues/[id]/assignment restricts ticket routing strictly to Admins', () => {
  const content = fs.readFileSync(assignRoutePath, 'utf8');
  assert.ok(content.includes("profile.role !== 'admin'"), 'Checks non-admin caller');
  assert.ok(content.includes('403'), 'Returns 403 for non-admins');
});

test('POST /api/issues/[id]/resolution restricts resolution submissions to Staff/Admin with proof', () => {
  const content = fs.readFileSync(resolutionRoutePath, 'utf8');
  assert.ok(content.includes("profile.role !== 'staff' && profile.role !== 'admin'"), 'Enforces staff or admin role');
  assert.ok(content.includes('!image_url'), 'Mandates resolution photo evidence');
  assert.ok(content.includes('!notes'), 'Mandates repair work completion notes');
});

test('GET /api/issues/[id] enforces cross-college isolation and student data ownership', () => {
  const content = fs.readFileSync(issueDetailRoutePath, 'utf8');
  assert.ok(content.includes('issue.college_id !== profile.college_id'), 'Enforces multi-college tenant boundary');
  assert.ok(content.includes("profile.role === 'student' && issue.reported_by !== userId"), 'Restricts students to own tickets');
});

test('GET /api/analytics restricts operational intelligence to administrative personnel', () => {
  const content = fs.readFileSync(analyticsRoutePath, 'utf8');
  assert.ok(content.includes("profile.role !== 'admin' && profile.role !== 'staff'"), 'Blocks unauthorized student access');
  assert.ok(content.includes('403'), 'Returns 403 Forbidden');
});

// -----------------------------------------------------------------------------
// 6. VERIFY DATABASE SECURITY MIGRATIONS & ROLE IMMUTABILITY
// -----------------------------------------------------------------------------
console.log('\n6. Verifying Database Security Migrations & Role Immutability...');

const migrationPath = path.join(rootDir, 'supabase/migrations/20261014000001_phase8_security_hardening.sql');

test('Phase 8 migration exists with role escalation prevention triggers', () => {
  assert.ok(fs.existsSync(migrationPath), 'Phase 8 security migration must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(sql.includes('prevent_role_or_college_escalation'), 'Must define escalation prevention function');
  assert.ok(sql.includes('trigger_prevent_role_escalation'), 'Must create trigger on public.profiles');
  assert.ok(sql.includes('enforce_student_registration_role'), 'Must restrict public self-registration to student role');
});

// -----------------------------------------------------------------------------
// 7. VERIFY DUPLICATE DETECTION API ALIASING
// -----------------------------------------------------------------------------
console.log('\n7. Verifying Duplicate Detection API Aliasing & Robustness...');

const matchesRoutePath = path.join(rootDir, 'src/app/api/matches/route.ts');
const reportPagePath = path.join(rootDir, 'src/app/student/report/page.tsx');

test('POST /api/matches returns both match and top_candidate for seamless compatibility', () => {
  const content = fs.readFileSync(matchesRoutePath, 'utf8');
  assert.ok(content.includes('match: matchResult.best_match'), 'Provides match field');
  assert.ok(content.includes('top_candidate: matchResult.best_match'), 'Provides top_candidate alias');
});

test('Student report page safely extracts candidate from top_candidate, match, or candidates array', () => {
  const content = fs.readFileSync(reportPagePath, 'utf8');
  assert.ok(content.includes('matchData.top_candidate || matchData.match'), 'Robust fallback candidate extraction');
  assert.ok(content.includes('setShowDuplicateModal(true)'), 'Triggers duplicate modal on match');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Phase 8 Verification Finished: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
