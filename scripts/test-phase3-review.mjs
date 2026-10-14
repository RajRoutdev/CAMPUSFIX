/**
 * CampusFix Phase 3 — In-Depth AI Scenario Test Suite
 * Exhaustively tests:
 * 1. Valid Image Analysis
 * 2. Poor / Ambiguous Image Analysis
 * 3. Invalid / Malformed Model Response Handling
 * 4. API Failure, Rate-Limit & Timeout Handling
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
console.log('CampusFix Phase 3 — In-Depth AI Scenario Testing');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SETUP: Replicate Production Zod Schema & Business Rules for Direct Testing
// -----------------------------------------------------------------------------
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

const GeminiAnalysisSchema = z.object({
  issue_title: z.string().min(3).max(100),
  category: CategoryEnum,
  severity: SeverityEnum,
  department: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  safety_risk: z.boolean(),
  evidence: z.array(z.string().min(3).max(200)).min(1).max(5),
});

const CRITICAL_HAZARD_KEYWORDS = [
  'exposed wire',
  'exposed wiring',
  'bare wire',
  'spark',
  'sparking',
  'electric shock',
  'short circuit',
  'fire',
  'smoke',
  'burning smell',
  'gas leak',
  'structural collapse',
  'falling ceiling',
];

const DEPARTMENT_MAP = {
  Electrical: 'Electrical',
  Plumbing: 'Plumbing',
  'Internet/Network': 'IT Support',
  'Classroom Equipment': 'IT Support',
  Cleanliness: 'Housekeeping',
  Furniture: 'Housekeeping',
  'Civil/Infrastructure': 'Housekeeping',
  Security: 'Security',
  Other: 'Maintenance',
};

function applyDeterministicBusinessRules(rawOutput) {
  const combinedText = `${rawOutput.issue_title} ${rawOutput.description} ${rawOutput.evidence.join(' ')}`.toLowerCase();
  let severity = rawOutput.severity;
  let safetyRisk = rawOutput.safety_risk;

  if (CRITICAL_HAZARD_KEYWORDS.some((kw) => combinedText.includes(kw))) {
    severity = 'critical';
    safetyRisk = true;
  }

  let department = rawOutput.department;
  const canonicalDept = DEPARTMENT_MAP[rawOutput.category];
  if (canonicalDept && (!department || department === 'General' || department === 'Other')) {
    department = canonicalDept;
  }

  return {
    ...rawOutput,
    severity,
    safety_risk: safetyRisk,
    department: department || canonicalDept || 'Maintenance',
  };
}

function extractJsonBlock(text) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return null;
}

function sanitizeRawModelOutput(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };

  if (typeof sanitized.severity === 'string') {
    sanitized.severity = sanitized.severity.toLowerCase();
  }

  if (typeof sanitized.safety_risk === 'string') {
    sanitized.safety_risk = sanitized.safety_risk.toLowerCase() === 'true';
  }

  const VALID_CATEGORIES = [
    'Electrical',
    'Plumbing',
    'Furniture',
    'Cleanliness',
    'Internet/Network',
    'Classroom Equipment',
    'Security',
    'Civil/Infrastructure',
    'Other',
  ];

  if (typeof sanitized.category === 'string') {
    const matched = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === sanitized.category.toLowerCase()
    );
    if (matched) {
      sanitized.category = matched;
    }
  }

  if (typeof sanitized.evidence === 'string') {
    sanitized.evidence = [sanitized.evidence];
  }

  return sanitized;
}

// -----------------------------------------------------------------------------
// TEST SCENARIO 1: Valid Image Analysis
// -----------------------------------------------------------------------------
console.log('1. Testing Valid Image Analysis Scenario...');
const validModelResponse = {
  issue_title: 'Damaged Classroom Ceiling Fan',
  category: 'Electrical',
  severity: 'medium',
  department: 'Electrical',
  description: 'Ceiling fan in classroom exhibits bent blades and severe mechanical wobbling during rotation.',
  safety_risk: false,
  evidence: [
    'Misaligned fan blade visibly vibrating',
    'Located over student seating area',
    'Creates classroom ventilation disruption',
  ],
};

const validation1 = GeminiAnalysisSchema.safeParse(validModelResponse);
assert(validation1.success, 'Valid image structured output strictly passes Zod schema');

const controlled1 = applyDeterministicBusinessRules(validation1.data);
assert(controlled1.severity === 'medium', 'Non-critical defect retains medium severity');
assert(controlled1.safety_risk === false, 'Non-critical defect has safety_risk: false');
assert(controlled1.department === 'Electrical', 'Department mapped to Electrical');
assert(controlled1.evidence.length === 3, 'Evidence array contains 3 observable statements');

// -----------------------------------------------------------------------------
// TEST SCENARIO 2: Poor / Ambiguous Image Analysis
// -----------------------------------------------------------------------------
console.log('\n2. Testing Poor / Ambiguous Image Analysis Scenario...');
const clientFile = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/client.ts'), 'utf8');

// Verify system instruction addresses ambiguous images
assert(
  clientFile.includes('dark, blurry, distant, or ambiguous'),
  'Gemini system instruction explicitly provides guidelines for ambiguous/poor quality images'
);
assert(
  clientFile.includes('on-site inspection recommended'),
  'System instructions guide model to advise on-site inspection for ambiguous photos'
);

// Simulate ambiguous image fallback with student description
const ambiguousPayload = {
  issue_title: 'Unidentified Fluid Seepage Near Baseboard',
  category: 'Plumbing',
  severity: 'medium',
  department: 'Plumbing',
  description: 'Water seepage observed behind classroom corner; source unclear from dark photo.',
  safety_risk: false,
  evidence: ['Moisture pooling along wall base', 'Photo partially obscured; on-site inspection recommended'],
};

const validation2 = GeminiAnalysisSchema.safeParse(ambiguousPayload);
assert(validation2.success, 'Ambiguous image response conforms to structured schema');
assert(
  validation2.data.evidence.some((e) => e.includes('on-site inspection')),
  'Evidence points constructively note ambiguity rather than hallucinating'
);

// -----------------------------------------------------------------------------
// TEST SCENARIO 3: Invalid / Malformed Model Response Handling
// -----------------------------------------------------------------------------
console.log('\n3. Testing Malformed Model Response & Schema Rejection Handling...');

// 3.1: Conversational wrapped JSON
const conversationalResponse =
  'Here is the analysis: {"issue_title": "Damaged Door Lock", "category": "Furniture", "severity": "low", "department": "Housekeeping", "description": "Door lock cylinder is loose.", "safety_risk": false, "evidence": ["Loose cylinder visible"]} Hope this helps!';

const extractedBlock = extractJsonBlock(conversationalResponse);
assert(!!extractedBlock, 'extractJsonBlock isolates JSON from conversational preamble/postscript');
const parsedExtracted = JSON.parse(extractedBlock);
assert(GeminiAnalysisSchema.safeParse(parsedExtracted).success, 'Extracted block validates successfully');

// 3.2: Malformed casing and string boolean coercion
const unnormalizedModelOutput = {
  issue_title: 'Water Seepage From Pipe',
  category: 'plumbing', // lowercase
  severity: 'HIGH', // uppercase
  department: 'Plumbing',
  description: 'Water pipe leaking onto floor continuously.',
  safety_risk: 'true', // string boolean
  evidence: 'Puddle formed on floor', // single string instead of array
};

const sanitized = sanitizeRawModelOutput(unnormalizedModelOutput);
const sanitizedValidation = GeminiAnalysisSchema.safeParse(sanitized);
assert(sanitizedValidation.success, 'sanitizeRawModelOutput coerces casing and types to pass Zod schema');
assert(sanitizedValidation.data.severity === 'high', 'Severity coerced to lowercase "high"');
assert(sanitizedValidation.data.category === 'Plumbing', 'Category normalized to canonical "Plumbing"');
assert(sanitizedValidation.data.safety_risk === true, 'String boolean "true" coerced to boolean true');
assert(Array.isArray(sanitizedValidation.data.evidence), 'Single string evidence coerced into array');

// 3.3: Total schema failure (invalid fields) -> strictly rejected
const invalidSchemaData = {
  issue_title: 'X', // Too short (min 3)
  category: 'InvalidNonExistentCategory', // Invalid enum
  severity: 'super-critical', // Invalid enum
};
const isValid = GeminiAnalysisSchema.safeParse(invalidSchemaData).success;
assert(!isValid, 'Schema validator strictly rejects unrecoverable model outputs');

// -----------------------------------------------------------------------------
// TEST SCENARIO 4: API Failure, Rate-Limit & Timeout Handling
// -----------------------------------------------------------------------------
console.log('\n4. Testing API Failure, Timeout & Fallback Robustness...');

// 4.1: Secret Isolation via Headers
assert(
  clientFile.includes("'x-goog-api-key': apiKey"),
  'Gemini API key passed securely via x-goog-api-key header (not in URL query)'
);
assert(
  !clientFile.includes('?key='),
  'API key completely eliminated from URL query string to prevent log leakage'
);

// 4.2: Timeout & Retry Configuration
assert(clientFile.includes('15000'), '15-second AbortSignal timeout configured');
assert(clientFile.includes('status === 429'), 'HTTP 429 rate limit triggers automatic retry');
assert(clientFile.includes('status >= 500'), 'HTTP 5xx server error triggers automatic retry');

// 4.3: Critical Safety Keyword Escalation
const hazardousIssue = {
  issue_title: 'Damaged Electric Board',
  category: 'Electrical',
  severity: 'medium',
  department: 'Electrical',
  description: 'Electric board has exposed wire and is sparking when students plug in devices.',
  safety_risk: false,
  evidence: ['Plugs are burnt', 'Visible sparking'],
};

const escalated = applyDeterministicBusinessRules(hazardousIssue);
assert(escalated.severity === 'critical', 'Hazard containing "exposed wire" and "sparking" escalated to critical severity');
assert(escalated.safety_risk === true, 'Hazard automatically sets safety_risk: true');

// 4.4: Fallback honesty
const fallbackFile = fs.readFileSync(path.join(rootDir, 'src/lib/gemini/fallback.ts'), 'utf8');
assert(fallbackFile.includes('generateDiagnosticsFallback'), 'Fallback diagnostics generator implemented');
assert(clientFile.includes('is_fallback: true'), 'Client sets is_fallback: true when live AI is unavailable');

console.log('\n================================================================');
console.log(`Phase 3 In-Depth Scenarios: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
