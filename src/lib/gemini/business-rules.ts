import { GeminiAnalysisOutput } from './schema';

/**
 * Deterministic business rules applied after AI suggestion.
 * Principle: "AI assists; application logic controls."
 * See AGENTS.md Section 6 and PRD Section 12 & 13.
 */

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

const DEPARTMENT_MAP: Record<string, string> = {
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

export function applyDeterministicBusinessRules(
  rawOutput: GeminiAnalysisOutput
): GeminiAnalysisOutput {
  const combinedText = `${rawOutput.issue_title} ${rawOutput.description} ${rawOutput.evidence.join(' ')}`.toLowerCase();

  let severity = rawOutput.severity;
  let safetyRisk = rawOutput.safety_risk;

  // 1. Critical Hazard Escalation Rule
  const hasCriticalHazard = CRITICAL_HAZARD_KEYWORDS.some((kw) =>
    combinedText.includes(kw)
  );

  if (hasCriticalHazard) {
    severity = 'critical';
    safetyRisk = true;
  }

  // 2. Department Normalization Rule
  // If department suggested by AI is generic or unmatched, normalize via official department map
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
