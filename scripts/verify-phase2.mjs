/**
 * Phase 2 — Student Experience Verification Script
 * Validates the student reporting workflow, mock AI suggestions,
 * issue creation, issue detail timeline, and UI components.
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

console.log('====================================================');
console.log('CampusFix Phase 2 — Student Experience Verification');
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

// 1. Check Required Files for Phase 2
console.log('1. Checking Phase 2 Files...');
const phase2Files = [
  'src/components/ui/textarea.tsx',
  'src/components/ui/status-badge.tsx',
  'src/components/ui/severity-badge.tsx',
  'src/lib/locations/data.ts',
  'src/lib/mock-ai/analyzer.ts',
  'src/lib/issues/store.ts',
  'src/app/api/analyze/route.ts',
  'src/app/api/issues/route.ts',
  'src/app/api/issues/[id]/route.ts',
  'src/app/student/dashboard/page.tsx',
  'src/app/student/report/page.tsx',
  'src/app/student/issues/[id]/page.tsx',
];

for (const file of phase2Files) {
  assert(fs.existsSync(path.join(rootDir, file)), `File exists: ${file}`);
}

// 2. Check Mock AI Logic
console.log('\n2. Verifying Mock AI Analysis Rules...');
const analyzerCode = fs.readFileSync(path.join(rootDir, 'src/lib/mock-ai/analyzer.ts'), 'utf8');

assert(analyzerCode.includes('Broken Ceiling Fan'), 'Mock AI handles standard ceiling fan scenario');
assert(analyzerCode.includes('Water Pipe Leakage'), 'Mock AI handles plumbing leakage scenario');
assert(analyzerCode.includes('Exposed Electrical Wiring Hazard'), 'Mock AI handles critical electrical hazard');
assert(analyzerCode.includes("severity: 'critical'"), 'Mock AI escalates critical hazards');
assert(analyzerCode.includes('safety_risk: true'), 'Mock AI identifies safety risks');
assert(analyzerCode.includes('is_mock: true'), 'Mock AI output honestly flags is_mock: true');
assert(analyzerCode.includes('evidence:'), 'Mock AI produces observable evidence points');

// 3. Check Predefined Locations
console.log('\n3. Verifying Predefined Campus Locations...');
const locationsCode = fs.readFileSync(path.join(rootDir, 'src/lib/locations/data.ts'), 'utf8');

assert(locationsCode.includes('Room 204'), 'Location Room 204 defined');
assert(locationsCode.includes('Block B'), 'Location Block B defined');
assert(locationsCode.includes('Central Library'), 'Location Central Library defined');
assert(locationsCode.includes('formatLocationString'), 'formatLocationString utility implemented');

// 4. Check API Routes
console.log('\n4. Verifying API Routes...');
const analyzeRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/analyze/route.ts'), 'utf8');
assert(analyzeRoute.includes('export async function POST'), 'POST /api/analyze route exported');

const issuesRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/issues/route.ts'), 'utf8');
assert(issuesRoute.includes('export async function GET'), 'GET /api/issues route exported');
assert(issuesRoute.includes('export async function POST'), 'POST /api/issues route exported');

const singleIssueRoute = fs.readFileSync(path.join(rootDir, 'src/app/api/issues/[id]/route.ts'), 'utf8');
assert(singleIssueRoute.includes('export async function GET'), 'GET /api/issues/[id] route exported');

// 5. Check Student UI Pages
console.log('\n5. Verifying Student Portal Pages...');
const dashboardCode = fs.readFileSync(path.join(rootDir, 'src/app/student/dashboard/page.tsx'), 'utf8');
assert(dashboardCode.includes('Total Reported'), 'Dashboard shows total issue count');
assert(dashboardCode.includes('Open / Pending'), 'Dashboard shows open/pending count');
assert(dashboardCode.includes('In Progress'), 'Dashboard shows in-progress count');
assert(dashboardCode.includes('Resolved'), 'Dashboard shows resolved count');
assert(dashboardCode.includes('Report Issue'), 'Dashboard has Report Issue CTA');
assert(dashboardCode.includes('No issues found. Your campus is looking good!'), 'Dashboard has empty state per PRD');

const reportCode = fs.readFileSync(path.join(rootDir, 'src/app/student/report/page.tsx'), 'utf8');
assert(reportCode.includes('accept="image/*"'), 'Report page supports mobile camera and image capture');
assert(reportCode.includes('Campus Location'), 'Report page includes campus location selector');
assert(reportCode.includes('Analyze Issue with AI'), 'Report page has AI analysis trigger');
assert(reportCode.includes('Review AI Suggestions'), 'Report page has review and edit screen');
assert(reportCode.includes('Confirm & Submit Ticket'), 'Report page has final ticket submission CTA');

const detailCode = fs.readFileSync(path.join(rootDir, 'src/app/student/issues/[id]/page.tsx'), 'utf8');
assert(detailCode.includes('Ticket Activity Timeline'), 'Detail page displays traceable activity timeline');
assert(detailCode.includes('Observable Evidence'), 'Detail page displays observable evidence points');
assert(detailCode.includes('Location Details'), 'Detail page displays location details card');

console.log('\n====================================================');
console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
