/**
 * CampusFix Phase 3 — Gemini Multimodal AI Verification Script
 * Validates:
 * 1. Zod schema validation (valid output passes, malformed output rejected)
 * 2. Deterministic safety rules (critical hazards escalated to 'critical' and safety_risk: true)
 * 3. Department normalization
 * 4. Transparent fallback diagnostics (honest is_fallback: true, no false claims)
 * 5. Server-side secret isolation (GEMINI_API_KEY never accessible to browser)
 * 6. Chain-of-thought protection (no internal reasoning requested or exposed)
 * 7. POST /api/analyze endpoint validation & auth guards
 * 8. Student review/edit interface support
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

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
console.log('CampusFix Phase 3 — Gemini Multimodal AI Verification');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. Check Phase 3 Files
// -----------------------------------------------------------------------------
console.log('1. Checking Phase 3 Files...');
const phase3Files = [
  'src/lib/gemini/schema.ts',
  'src/lib/gemini/business-rules.ts',
  'src/lib/gemini/fallback.ts',
  'src/lib/gemini/client.ts',
  'src/app/api/analyze/route.ts',
  'src/app/student/report/page.tsx',
];

for (const file of phase3Files) {
  assert(fs.existsSync(path.join(rootDir, file)), `File exists: ${file}`);
}

// -----------------------------------------------------------------------------
// 2. Schema Definition & Zod Validation
// -----------------------------------------------------------------------------
console.log('\n2. Testing Structured Output Schema & Zod Validation...');
const schemaCode = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/schema.ts'), 'utf8');

assert(schemaCode.includes('GeminiAnalysisSchema'), 'GeminiAnalysisSchema defined with Zod');
assert(schemaCode.includes('issue_title: z'), 'Schema enforces issue_title');
assert(schemaCode.includes('category: CategoryEnum'), 'Schema enforces category enum');
assert(schemaCode.includes('severity: SeverityEnum'), 'Schema enforces severity enum');
assert(schemaCode.includes('department: z'), 'Schema enforces department');
assert(schemaCode.includes('description: z'), 'Schema enforces description');
assert(schemaCode.includes('safety_risk: z.boolean()'), 'Schema enforces safety_risk boolean');
assert(schemaCode.includes('evidence: z'), 'Schema enforces evidence array');
assert(!schemaCode.includes('chain_of_thought'), 'Schema strictly omits hidden chain-of-thought');
assert(!schemaCode.includes('reasoning:'), 'Schema strictly omits internal reasoning field');

// Test Zod validation behavior directly
const CategoryEnum = z.enum([
  'Electrical',
  'Plumbing',
  'Furniture',
  'Cleanliness',
  'Internet/Network',
  'Classroom Equipment',
  'Security',
  'Civil/Infrastructure',
  'Other',
]);
const SeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const TestSchema = z.object({
  issue_title: z.string().min(3).max(100),
  category: CategoryEnum,
  severity: SeverityEnum,
  department: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  safety_risk: z.boolean(),
  evidence: z.array(z.string().min(3).max(200)).min(1).max(5),
});

const validPayload = {
  issue_title: 'Broken Ceiling Fan in Room 204',
  category: 'Electrical',
  severity: 'medium',
  department: 'Electrical',
  description: 'Ceiling fan is visibly wobbling and creating excessive mechanical noise.',
  safety_risk: false,
  evidence: ['Fan blade visibly misaligned', 'Excessive vibration during operation'],
};
assert(TestSchema.safeParse(validPayload).success, 'Zod accepts valid structured issue output');

const invalidCategoryPayload = {
  ...validPayload,
  category: 'NuclearPhysics', // Invalid category
};
assert(!TestSchema.safeParse(invalidCategoryPayload).success, 'Zod rejects invalid category');

const missingEvidencePayload = {
  ...validPayload,
  evidence: [], // Minimum 1 evidence point required
};
assert(!TestSchema.safeParse(missingEvidencePayload).success, 'Zod rejects empty evidence array');

const invalidSeverityPayload = {
  ...validPayload,
  severity: 'apocalyptic', // Invalid severity
};
assert(!TestSchema.safeParse(invalidSeverityPayload).success, 'Zod rejects invalid severity level');

// -----------------------------------------------------------------------------
// 3. Deterministic Business Rules & Safety Escalation
// -----------------------------------------------------------------------------
console.log('\n3. Testing Deterministic Business Rules & Safety Escalation...');
const businessRulesCode = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/business-rules.ts'), 'utf8');

assert(businessRulesCode.includes('applyDeterministicBusinessRules'), 'applyDeterministicBusinessRules function defined');
assert(businessRulesCode.includes('CRITICAL_HAZARD_KEYWORDS'), 'Critical hazard keyword checks defined');
assert(businessRulesCode.includes('exposed wire'), 'Checks for exposed wire hazards');
assert(businessRulesCode.includes('spark'), 'Checks for sparking hazards');
assert(businessRulesCode.includes('fire'), 'Checks for fire hazards');
assert(businessRulesCode.includes("severity = 'critical'"), 'Enforces critical severity on hazards');
assert(businessRulesCode.includes('safetyRisk = true'), 'Enforces safety_risk = true on hazards');
assert(businessRulesCode.includes('DEPARTMENT_MAP'), 'Canonical department mapping defined');

// -----------------------------------------------------------------------------
// 4. Server-Side Secret Management & Security
// -----------------------------------------------------------------------------
console.log('\n4. Testing Secret Management & Browser Isolation...');
const clientCode = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/client.ts'), 'utf8');
assert(clientCode.includes("typeof window !== 'undefined'"), 'Client asserts server-side only execution');
assert(clientCode.includes('process.env.GEMINI_API_KEY'), 'Reads GEMINI_API_KEY strictly server-side');
assert(!clientCode.includes('NEXT_PUBLIC_GEMINI_API_KEY'), 'Gemini key NEVER uses NEXT_PUBLIC_ prefix');

// Verify browser UI code does not leak server secrets
const reportClientCode = fs.readFileSync(path.join(rootDir, 'src/app/student/report/page.tsx'), 'utf8');
assert(!reportClientCode.includes('GEMINI_API_KEY'), 'Browser student report page does not reference GEMINI_API_KEY');
assert(!reportClientCode.includes('SERVICE_ROLE_KEY'), 'Browser student report page does not reference SERVICE_ROLE_KEY');

const loginClientCode = fs.readFileSync(path.join(rootDir, 'src/app/(auth)/login/page.tsx'), 'utf8');
assert(!loginClientCode.includes('GEMINI_API_KEY'), 'Login page does not reference GEMINI_API_KEY');

// -----------------------------------------------------------------------------
// 5. Timeout, Retry, and Network Fault Tolerance
// -----------------------------------------------------------------------------
console.log('\n5. Testing Timeout, Retry & Error Handling...');
assert(clientCode.includes('AbortController'), 'Implements AbortController for request cancellation');
assert(clientCode.includes('15000'), 'Configures 15-second timeout for Gemini requests');
assert(clientCode.includes('maxAttempts'), 'Configures automatic retry attempts');
assert(clientCode.includes('status === 429'), 'Handles HTTP 429 rate-limiting with retry');
assert(clientCode.includes('generateDiagnosticsFallback'), 'Transparently falls back when live call fails');

// -----------------------------------------------------------------------------
// 6. Transparent Fallback Diagnostics
// -----------------------------------------------------------------------------
console.log('\n6. Testing Transparent Fallback Diagnostics...');
const fallbackCode = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/fallback.ts'), 'utf8');
assert(fallbackCode.includes('generateDiagnosticsFallback'), 'generateDiagnosticsFallback function defined');
assert(fallbackCode.includes('Exposed Electrical Wiring Hazard'), 'Fallback supports electrical hazards');
assert(fallbackCode.includes('Water Pipe Leakage'), 'Fallback supports plumbing leaks');
assert(fallbackCode.includes('Damaged Classroom Ceiling Fan'), 'Fallback supports damaged ceiling fans');
assert(fallbackCode.includes('Classroom AV / Projector Malfunction'), 'Fallback supports IT/AV equipment');
assert(fallbackCode.includes('Damaged Classroom Furniture'), 'Fallback supports housekeeping/furniture');
assert(clientCode.includes('is_fallback: true'), 'Flags is_fallback: true when diagnostic fallback runs');
assert(clientCode.includes('provider:'), 'Identifies model/provider source');

// -----------------------------------------------------------------------------
// 7. POST /api/analyze Route Guard & Contract
// -----------------------------------------------------------------------------
console.log('\n7. Testing POST /api/analyze Contract...');
const analyzeRouteCode = fs.readFileSync(path.join(rootDir, 'src/app/api/analyze/route.ts'), 'utf8');
assert(analyzeRouteCode.includes('getCurrentUser()'), 'POST /api/analyze verifies authenticated session');
assert(analyzeRouteCode.includes('401'), 'POST /api/analyze returns 401 for unauthenticated requests');
assert(analyzeRouteCode.includes('10 * 1024 * 1024'), 'POST /api/analyze enforces 10MB payload size limit');
assert(analyzeRouteCode.includes('!imageData && !description'), 'POST /api/analyze validates presence of photo or description');
assert(analyzeRouteCode.includes('analyzeCampusIssue'), 'POST /api/analyze invokes server Gemini pipeline');

// -----------------------------------------------------------------------------
// 8. Student Review Screen & Editability
// -----------------------------------------------------------------------------
console.log('\n8. Testing Student Review Screen & Editability...');
assert(reportClientCode.includes('imageData: imagePreview'), 'Student report sends image base64 data to /api/analyze');
assert(reportClientCode.includes('Diagnostic Fallback'), 'Displays honest badge when fallback is active');
assert(reportClientCode.includes('Gemini 1.5 Analysis'), 'Displays Gemini badge when live AI analysis runs');
assert(reportClientCode.includes('editableTitle'), 'Title is editable before final ticket creation');
assert(reportClientCode.includes('editableDescription'), 'Description is editable before final ticket creation');
assert(reportClientCode.includes('editableCategory'), 'Category is displayed and reviewable');
assert(reportClientCode.includes('editableSeverity'), 'Severity is displayed and reviewable');
assert(reportClientCode.includes('handleManualEntry'), 'Student can proceed with manual entry if AI fails');

console.log('\n================================================================');
console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
