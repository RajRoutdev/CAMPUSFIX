/**
 * CampusFix Phase 7 — UI/UX Polish Verification Suite
 *
 * Verifies:
 * 1. Responsive mobile navigation:
 *    - Hamburger menu button with accessible aria attributes
 *    - Mobile dropdown drawer listing role portals and quick actions
 *    - Desktop navigation with active highlights
 * 2. Mobile Student Experience:
 *    - Stepper indicator (Step 1: Photo & Location, Step 2: AI Review & Verify)
 *    - Mobile camera capture & browse file controls
 *    - Loading feedback during AI analysis and duplicate detection
 *    - 4-Factor duplicate detection card with responsive layout
 *    - Resolution lifecycle visual progress bar in student issue detail
 *    - Before & After resolution photo inspection
 * 3. Staff & Admin Operations:
 *    - Filter toolbar with status and category filtering
 *    - Inline action feedback replacing intrusive browser alerts
 *    - Resolution proof submission with photo and completion notes
 *    - Responsive overflow-x-auto table on admin issue management
 * 4. Semantic Color & Badge Consistency:
 *    - Blue/indigo primary for assigned work & core navigation
 *    - Green for resolved/verified/closed/low
 *    - Amber for in-progress/medium/recurring warnings
 *    - Red for high/critical/safety risks
 *    - Gray for new/inactive
 * 5. Accessibility & Typography:
 *    - Form controls have corresponding htmlFor label bindings
 *    - Keyboard focus rings defined in globals.css
 *    - Clean typography hierarchy and card spacing
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
console.log('CampusFix Phase 7 — UI/UX Polish Verification');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. Responsive Navigation & Mobile Menu
// -----------------------------------------------------------------------------
console.log('1. Verifying Responsive Navigation & Mobile Menu...');
const navbarCode = fs.readFileSync(path.join(rootDir, 'src/components/layout/Navbar.tsx'), 'utf8');

assert(navbarCode.includes('setMobileMenuOpen'), 'Navbar manages mobileMenuOpen state');
assert(navbarCode.includes('aria-label') && navbarCode.includes('aria-expanded'), 'Mobile menu toggle includes accessible aria attributes');
assert(navbarCode.includes('md:hidden') && navbarCode.includes('hidden md:flex'), 'Navbar has distinct responsive mobile and desktop viewports');
assert(navbarCode.includes('/admin/analytics'), 'Navbar includes Campus Intelligence link');
assert(navbarCode.includes('getRoleBadge'), 'Navbar displays active role badge');

// -----------------------------------------------------------------------------
// 2. Mobile Student Experience
// -----------------------------------------------------------------------------
console.log('\n2. Verifying Mobile Student Experience...');
const reportCode = fs.readFileSync(path.join(rootDir, 'src/app/student/report/page.tsx'), 'utf8');
const studentDashboardCode = fs.readFileSync(path.join(rootDir, 'src/app/student/dashboard/page.tsx'), 'utf8');
const studentDetailCode = fs.readFileSync(path.join(rootDir, 'src/app/student/issues/[id]/page.tsx'), 'utf8');

assert(reportCode.includes('Photo &amp; Location') && reportCode.includes('AI Review &amp; Verify'), 'Report page displays visual stepper progress indicator');
assert(reportCode.includes('capture="environment"'), 'Report page supports mobile camera photo capture');
assert(reportCode.includes('AI Analyzing Photo'), 'Report page includes animated loading feedback during AI analysis');
assert(reportCode.includes('Location Signal') && reportCode.includes('Category Signal'), 'Duplicate warning displays 4-factor breakdown signals');
assert(reportCode.includes('never silently merge') || reportCode.includes('never silently merges'), 'Duplicate UI reinforces Never Silently Merge policy');
assert(studentDashboardCode.includes('filteredIssues'), 'Student dashboard provides instant filter pills (All / Active / Resolved)');
assert(studentDashboardCode.includes('animate-pulse'), 'Student dashboard provides loading skeleton animation');
assert(studentDetailCode.includes('Resolution Lifecycle') && studentDetailCode.includes('Reported'), 'Student ticket detail displays horizontal lifecycle progress bar');
assert(studentDetailCode.includes('resolutionImage'), 'Student ticket detail supports resolution proof photo inspection');

// -----------------------------------------------------------------------------
// 3. Desktop Staff & Admin Operations
// -----------------------------------------------------------------------------
console.log('\n3. Verifying Staff & Admin Operational Polish...');
const staffDashboardCode = fs.readFileSync(path.join(rootDir, 'src/app/staff/dashboard/page.tsx'), 'utf8');
const staffDetailCode = fs.readFileSync(path.join(rootDir, 'src/app/staff/issues/[id]/page.tsx'), 'utf8');
const adminDetailCode = fs.readFileSync(path.join(rootDir, 'src/app/admin/issues/[id]/page.tsx'), 'utf8');
const adminIssuesCode = fs.readFileSync(path.join(rootDir, 'src/app/admin/issues/page.tsx'), 'utf8');

assert(staffDashboardCode.includes('actionFeedback'), 'Staff dashboard uses inline action feedback instead of browser alert');
assert(staffDashboardCode.includes('Start Work'), 'Staff dashboard provides quick Start Work action button');
assert(staffDetailCode.includes('formSuccess'), 'Staff resolution detail provides inline success banner on completion');
assert(adminDetailCode.includes('actionError'), 'Admin ticket detail uses inline error notifications instead of browser alert');
assert(adminDetailCode.includes('Resolution successfully verified'), 'Admin ticket detail confirms verification action');
assert(adminIssuesCode.includes('overflow-x-auto') && adminIssuesCode.includes('min-w-'), 'Admin issues table is wrapped in responsive scroll container');

// -----------------------------------------------------------------------------
// 4. Semantic Color & Badge Consistency
// -----------------------------------------------------------------------------
console.log('\n4. Verifying Semantic Colors & Badge Rules...');
const statusBadgeCode = fs.readFileSync(path.join(rootDir, 'src/components/ui/status-badge.tsx'), 'utf8');
const severityBadgeCode = fs.readFileSync(path.join(rootDir, 'src/components/ui/severity-badge.tsx'), 'utf8');

// Blue/indigo for assigned
assert(statusBadgeCode.includes('ASSIGNED') && statusBadgeCode.includes('text-blue-600'), 'Assigned status uses primary blue/indigo');
// Amber for in_progress / medium
assert(statusBadgeCode.includes('IN_PROGRESS') && statusBadgeCode.includes('text-amber-600'), 'In Progress status uses amber');
assert(severityBadgeCode.includes('medium') && severityBadgeCode.includes('text-amber-600'), 'Medium severity uses amber');
// Green for verified / closed / low
assert(statusBadgeCode.includes('VERIFIED') && statusBadgeCode.includes('text-emerald-600'), 'Verified status uses green');
assert(statusBadgeCode.includes('CLOSED') && statusBadgeCode.includes('text-emerald-600'), 'Closed status uses green');
assert(severityBadgeCode.includes('low') && severityBadgeCode.includes('text-emerald-600'), 'Low severity uses green');
// Red for high / critical
assert(severityBadgeCode.includes('critical') && severityBadgeCode.includes('destructive'), 'Critical severity uses red');
assert(severityBadgeCode.includes('high') && severityBadgeCode.includes('text-rose-600'), 'High severity uses red');
// Gray for new
assert(statusBadgeCode.includes('NEW') && statusBadgeCode.includes('text-slate-700'), 'New status uses neutral slate/gray');

// -----------------------------------------------------------------------------
// 5. Accessibility & Typography
// -----------------------------------------------------------------------------
console.log('\n5. Verifying Accessibility Basics & Global Focus Styling...');
const globalsCss = fs.readFileSync(path.join(rootDir, 'src/app/globals.css'), 'utf8');
const layoutCode = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf8');

assert(globalsCss.includes('*:focus-visible'), 'globals.css specifies accessible focus-visible ring styles');
assert(globalsCss.includes('-webkit-tap-highlight-color: transparent'), 'globals.css optimizes mobile tap highlights');
assert(layoutCode.includes('<html lang="en">'), 'RootLayout specifies language attribute');
assert(reportCode.includes('htmlFor="location-select"'), 'Report page binds location label to select input via htmlFor');
assert(reportCode.includes('htmlFor="student-desc"'), 'Report page binds description label to textarea via htmlFor');
assert(reportCode.includes('htmlFor="issue-photo-input"'), 'Report page binds photo label to file input via htmlFor');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Phase 7 Polish Verification Finished: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
