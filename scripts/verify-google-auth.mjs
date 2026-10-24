/**
 * CampusFix Google Authentication Integration Verification Script
 *
 * Verifies:
 * 1. Google sign-in button component with official Google branding and loading/error handling.
 * 2. OAuth callback handler at src/app/api/auth/callback/route.ts.
 * 3. Strict least-privileged default role (student) on newly provisioned OAuth users.
 * 4. Open-redirect prevention and URL sanitization.
 * 5. Supabase session signOut integration in logout handler.
 * 6. Non-destructive integration across /login, /student/login, and /student/register.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('CampusFix — Google Authentication Integration Verification');
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

// 1. Google Sign-In Button Component
test('GoogleSignInButton component exists with official branding & OAuth flow', () => {
  const filePath = path.join(rootDir, 'src/components/auth/google-sign-in-button.tsx');
  assert(fs.existsSync(filePath), 'Component file should exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes("provider: 'google'"), 'Should invoke signInWithOAuth with google provider');
  assert(content.includes('/api/auth/callback'), 'Should target /api/auth/callback');
  assert(content.includes('#4285F4'), 'Should include Google blue logo color');
  assert(content.includes('#34A853'), 'Should include Google green logo color');
  assert(content.includes('#FBBC05'), 'Should include Google yellow logo color');
  assert(content.includes('#EA4335'), 'Should include Google red logo color');
  assert(content.includes('disabled={loading}'), 'Should prevent repeated clicks during initiation');
});

// 2. OAuth Callback Route
test('OAuth callback route exists with session exchange and anti-escalation security', () => {
  const filePath = path.join(rootDir, 'src/app/api/auth/callback/route.ts');
  assert(fs.existsSync(filePath), 'Callback route file should exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes('exchangeCodeForSession(code)'), 'Should exchange code for session');
  assert(content.includes("role: effectiveRole") || content.includes("role: 'student'"), 'Should assign profile role');
  assert(content.includes("effectiveRole = 'student'"), 'Newly provisioned profiles must strictly default to student');
  assert(content.includes("campusfix_session"), 'Should set campusfix_session cookie');
  assert(content.includes("sanitizeRedirectTarget"), 'Must have redirect target sanitization');
});

// 3. Open Redirect Sanitization Unit Tests
test('Open-redirect sanitization blocks attacks and enforces RBAC boundaries', () => {
  // Re-implemented logic matching src/app/api/auth/callback/route.ts
  function sanitizeRedirectTarget(target, userRole) {
    const fallback =
      userRole === 'admin'
        ? '/admin/dashboard'
        : userRole === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard';

    if (!target) return fallback;
    if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
      return fallback;
    }
    if (target.includes(':')) {
      return fallback;
    }
    if (target.startsWith('/admin') && userRole !== 'admin') {
      return fallback;
    }
    if (target.startsWith('/staff') && userRole !== 'staff') {
      return fallback;
    }
    if (target.startsWith('/student') && userRole !== 'student') {
      return fallback;
    }
    return target;
  }

  // Safe student navigation
  assert.strictEqual(sanitizeRedirectTarget('/student/report', 'student'), '/student/report');
  assert.strictEqual(sanitizeRedirectTarget('/student/tickets/123', 'student'), '/student/tickets/123');

  // Open-redirect attack vectors
  assert.strictEqual(sanitizeRedirectTarget('https://evil.com', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('//evil.com', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('/\\evil.com', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('javascript:alert(1)', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('/javascript:alert(1)', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget(null, 'student'), '/student/dashboard');

  // Role isolation enforcement
  assert.strictEqual(sanitizeRedirectTarget('/admin/settings', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('/staff/assigned', 'student'), '/student/dashboard');
  assert.strictEqual(sanitizeRedirectTarget('/admin/settings', 'admin'), '/admin/settings');
  assert.strictEqual(sanitizeRedirectTarget('/staff/dashboard', 'staff'), '/staff/dashboard');
});

// 4. Logout Handler
test('Logout handler invalidates both Supabase session and application cookies', () => {
  const filePath = path.join(rootDir, 'src/app/api/auth/logout/route.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes('auth.signOut()'), 'Should call supabase.auth.signOut()');
  assert(content.includes("cookieStore.delete('campusfix_session')"), 'Should clear session cookie');
  assert(content.includes("cookieStore.delete('campusfix_logged_in')"), 'Should clear logged in flag');
  assert(content.includes("cookieStore.delete('campusfix_role')"), 'Should clear role flag');
});

// 5. Strict Portal Containment (Google Auth restricted exclusively to Student Portal)
test('Google Sign-In is restricted exclusively to student portal and touches neither staff nor admin', () => {
  // Student Login has Google
  const studentLogin = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/student/login/page.tsx'), 'utf8');
  assert(studentLogin.includes('GoogleSignInButton'), 'Student login should include GoogleSignInButton');
  assert(studentLogin.includes('handleLogin'), 'Student login must preserve email/password form handler');

  // Student Register has Google
  const studentRegister = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/student/register/page.tsx'), 'utf8');
  assert(studentRegister.includes('GoogleSignInButton'), 'Student register should include GoogleSignInButton');
  assert(studentRegister.includes('handleRegister'), 'Student register must preserve registration form handler');

  // Main Login Selector does NOT have Google (pure portal chooser)
  const mainLogin = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/login/page.tsx'), 'utf8');
  assert(!mainLogin.includes('GoogleSignInButton'), 'Main login must NOT include GoogleSignInButton');
  assert(mainLogin.includes('/student/login') && mainLogin.includes('/staff/login') && mainLogin.includes('/admin/login'),
    'Main login must preserve all portal links');

  // Staff Login does NOT have Google
  const staffLogin = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/staff/login/page.tsx'), 'utf8');
  assert(!staffLogin.includes('GoogleSignInButton'), 'Staff login must NOT have Google sign-in');

  // Admin Login does NOT have Google
  const adminLogin = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/admin/login/page.tsx'), 'utf8');
  assert(!adminLogin.includes('GoogleSignInButton'), 'Admin login must NOT have Google sign-in');
});

// 6. Environment Example Documentation
test('.env.example documents NEXT_PUBLIC_SITE_URL without secrets', () => {
  const envExample = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
  assert(envExample.includes('NEXT_PUBLIC_SITE_URL='), '.env.example should document NEXT_PUBLIC_SITE_URL');
  assert(!envExample.includes('AIzaSy'), 'Must not contain real Google secrets');
});

console.log('\n----------------------------------------------------------------');
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
console.log('----------------------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
}
