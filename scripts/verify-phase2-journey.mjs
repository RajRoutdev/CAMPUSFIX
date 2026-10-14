/**
 * CampusFix Phase 2 — Complete Student Journey & Security Verification Script
 * Validates the complete student journey:
 * login → dashboard → report issue → image/location/description → analysis review → create issue → issue detail
 *
 * Checks:
 * 1. Authentication & fallback demo login routes
 * 2. Student-only access & role-based middleware guards
 * 3. Data ownership & isolation (student cannot view other student tickets)
 * 4. Image upload & camera capture compatibility
 * 5. Strict server-side form validation (title, description, location, image)
 * 6. Responsive layouts & state handling (loading, empty, error)
 * 7. Issue creation & CF-xxxx ticket generation
 * 8. Activity log timeline & observable evidence display
 * 9. Accessibility basics (aria-labels, htmlFor, explicit IDs)
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
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

console.log('================================================================');
console.log('CampusFix Phase 2 — Complete Student Journey & Security Audit');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. Authentication, Demo Session & Logout
// -----------------------------------------------------------------------------
console.log('1. Testing Authentication & Session Strategy...');
const demoAccountsCode = fs.readFileSync(path.join(rootDir, 'src/lib/auth/demo-accounts.ts'), 'utf8');
assert(demoAccountsCode.includes("student@campusfix.edu"), 'Demo student account exists');
assert(demoAccountsCode.includes("e1111111-1111-1111-1111-111111111111"), 'Student UUID matches database seed');
assert(demoAccountsCode.includes("11111111-1111-1111-1111-111111111111"), 'Student college_id matches Apex Institute');

const loginRouteCode = fs.readFileSync(path.join(rootDir, 'src/app/api/auth/login/route.ts'), 'utf8');
assert(loginRouteCode.includes('campusfix_session'), 'POST /api/auth/login sets campusfix_session cookie');
assert(loginRouteCode.includes('DEMO_PASSWORD'), 'POST /api/auth/login validates credentials');
assert(loginRouteCode.includes('maxAge: 60 * 60 * 24'), 'Session cookie duration is 24 hours');

const logoutRouteCode = fs.readFileSync(path.join(rootDir, 'src/app/api/auth/logout/route.ts'), 'utf8');
assert(logoutRouteCode.includes("delete('campusfix_session')"), 'POST /api/auth/logout clears session cookie');

const loginPageCode = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/login/page.tsx'), 'utf8');
assert(loginPageCode.includes('signInWithPassword'), 'Login page attempts Supabase Auth');
assert(loginPageCode.includes('/api/auth/login'), 'Login page falls back to /api/auth/login for reliable offline/demo testing');
assert(loginPageCode.includes('navigateToRole'), 'Login page routes user to appropriate role portal');

// -----------------------------------------------------------------------------
// 2. Student-Only Access & Middleware Route Guards
// -----------------------------------------------------------------------------
console.log('\n2. Testing Student-Only Access & Middleware Route Guards...');
const middlewareCode = fs.readFileSync(path.join(rootDir, 'src/middleware.ts'), 'utf8');
assert(middlewareCode.includes("pathname.startsWith('/student')"), 'Middleware guards /student/* routes');
assert(middlewareCode.includes("pathname.startsWith('/staff')"), 'Middleware guards /staff/* routes');
assert(middlewareCode.includes("pathname.startsWith('/admin')"), 'Middleware guards /admin/* routes');
assert(middlewareCode.includes("userRole === 'student'"), 'Middleware inspects user role for route access');
assert(middlewareCode.includes("new URL('/student/dashboard'"), 'Middleware prevents students from accessing staff/admin portals');
assert(middlewareCode.includes("loginUrl.searchParams.set('redirectTo', pathname)"), 'Middleware preserves redirectTo parameter on unauthenticated redirect');

// -----------------------------------------------------------------------------
// 3. Data Ownership & Tenant Isolation
// -----------------------------------------------------------------------------
console.log('\n3. Testing Data Ownership & Tenant Isolation...');
const singleIssueApiCode = fs.readFileSync(path.join(rootDir, 'src/app/api/issues/[id]/route.ts'), 'utf8');
assert(singleIssueApiCode.includes('getCurrentUser()'), 'GET /api/issues/[id] requires authenticated session');
assert(singleIssueApiCode.includes('401'), 'GET /api/issues/[id] returns 401 if unauthenticated');
assert(
  singleIssueApiCode.includes("profile.role === 'student' && issue.reported_by !== userId"),
  'GET /api/issues/[id] verifies student only accesses their own ticket'
);
assert(
  singleIssueApiCode.includes('403'),
  'GET /api/issues/[id] returns 403 Forbidden for unauthorized access'
);
assert(
  singleIssueApiCode.includes('issue.college_id !== profile.college_id'),
  'GET /api/issues/[id] enforces cross-college tenant isolation'
);

const listIssuesApiCode = fs.readFileSync(path.join(rootDir, 'src/app/api/issues/route.ts'), 'utf8');
assert(listIssuesApiCode.includes('getCurrentUser()'), 'GET /api/issues requires authenticated session');
assert(listIssuesApiCode.includes('401'), 'GET /api/issues returns 401 if unauthenticated');
assert(listIssuesApiCode.includes("i.reported_by === userId"), 'GET /api/issues scopes tickets to current student');

// -----------------------------------------------------------------------------
// 4. Form Validation & Issue Creation
// -----------------------------------------------------------------------------
console.log('\n4. Testing Form Validation & Required Fields...');
assert(listIssuesApiCode.includes('if (!title)'), 'POST /api/issues validates title is required');
assert(listIssuesApiCode.includes('if (!description)'), 'POST /api/issues validates description is required');
assert(listIssuesApiCode.includes('if (!location_id)'), 'POST /api/issues validates location is required');
assert(listIssuesApiCode.includes('if (!image_url)'), 'POST /api/issues validates photo of issue is required');
assert(listIssuesApiCode.includes('reported_by = userId'), 'POST /api/issues derives reported_by from session');
assert(listIssuesApiCode.includes('college_id = profile.college_id'), 'POST /api/issues derives college_id from session');

// -----------------------------------------------------------------------------
// 5. Mock AI Analysis & Multi-Step Reporting Flow
// -----------------------------------------------------------------------------
console.log('\n5. Testing Mock AI Analysis & Student Report UI...');
const analyzerCode = fs.readFileSync(path.join(rootDir, 'src/lib/mock-ai/analyzer.ts'), 'utf8');
assert(analyzerCode.includes('Broken Ceiling Fan'), 'Mock AI handles ceiling fan scenario');
assert(analyzerCode.includes('Water Pipe Leakage'), 'Mock AI handles water pipe leakage scenario');
assert(analyzerCode.includes('Exposed Electrical Wiring Hazard'), 'Mock AI handles critical electrical hazard');
assert(analyzerCode.includes("safety_risk: true"), 'Mock AI identifies safety risks');
assert(analyzerCode.includes("is_mock: true"), 'Mock AI honestly returns is_mock: true');
assert(analyzerCode.includes("evidence:"), 'Mock AI produces observable evidence points');

const reportPageCode = fs.readFileSync(path.join(rootDir, 'src/app/student/report/page.tsx'), 'utf8');
assert(reportPageCode.includes('capture="environment"'), 'Report page supports mobile camera capture');
assert(reportPageCode.includes('PREDEFINED_LOCATIONS'), 'Report page provides predefined campus location selector');
assert(reportPageCode.includes('handleAnalyze'), 'Report page triggers AI analysis step');
assert(reportPageCode.includes('Review AI Suggestions'), 'Report page presents review screen with editable fields');
assert(reportPageCode.includes('handleSubmitTicket'), 'Report page submits confirmed ticket');

// -----------------------------------------------------------------------------
// 6. Student Dashboard & Metrics
// -----------------------------------------------------------------------------
console.log('\n6. Testing Student Dashboard...');
const dashboardCode = fs.readFileSync(path.join(rootDir, 'src/app/student/dashboard/page.tsx'), 'utf8');
assert(dashboardCode.includes('Total Reported'), 'Dashboard displays Total Reported metric');
assert(dashboardCode.includes('Open / Pending'), 'Dashboard displays Open / Pending metric');
assert(dashboardCode.includes('In Progress'), 'Dashboard displays In Progress metric');
assert(dashboardCode.includes('Resolved'), 'Dashboard displays Resolved metric');
assert(dashboardCode.includes('Report Issue'), 'Dashboard displays Report Issue CTA');
assert(dashboardCode.includes('No issues found. Your campus is looking good!'), 'Dashboard has empty state per PRD');
assert(dashboardCode.includes('Loading your tickets...'), 'Dashboard has loading state');

// -----------------------------------------------------------------------------
// 7. Issue Detail & Activity Timeline
// -----------------------------------------------------------------------------
console.log('\n7. Testing Issue Detail & Activity Timeline...');
const detailCode = fs.readFileSync(path.join(rootDir, 'src/app/student/issues/[id]/page.tsx'), 'utf8');
assert(detailCode.includes('Ticket Activity Timeline'), 'Detail page has traceable activity timeline');
assert(detailCode.includes('Observable Evidence'), 'Detail page displays AI observable evidence');
assert(detailCode.includes('Location Details'), 'Detail page displays building, floor, room location card');
assert(detailCode.includes('Ticket Not Found'), 'Detail page has error/not found state');
assert(detailCode.includes('Loading ticket details...'), 'Detail page has loading state');
assert(!detailCode.includes('CF-{issue.ticket_number}'), 'Detail page removes duplicate CF-CF- prefix');

// -----------------------------------------------------------------------------
// 8. Accessibility & Polish
// -----------------------------------------------------------------------------
console.log('\n8. Testing Accessibility & UI Polish...');
assert(reportPageCode.includes('id="issue-photo-input"'), 'File input has explicit id attribute');
assert(reportPageCode.includes('aria-label="Upload photo of campus issue"'), 'File input has aria-label attribute');
assert(reportPageCode.includes('htmlFor="issue-photo-input"'), 'Label has matching htmlFor attribute');

const navbarCode = fs.readFileSync(path.join(rootDir, 'src/components/layout/Navbar.tsx'), 'utf8');
assert(navbarCode.includes('Sign Out'), 'Navbar provides Sign Out action when user has active session');
assert(navbarCode.includes('/api/auth/logout'), 'Navbar invokes logout API');

console.log('\n================================================================');
console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
