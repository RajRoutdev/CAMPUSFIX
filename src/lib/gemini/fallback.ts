import { GeminiAnalysisOutput } from './schema';
import { applyDeterministicBusinessRules } from './business-rules';

interface FallbackInput {
  description?: string;
  locationText?: string;
  imageFileName?: string;
}

/**
 * Transparent diagnostic fallback when live Gemini API is offline,
 * unconfigured, or experiencing rate-limiting/timeouts.
 * Conforms 100% to PRD Section 10 schema and AGENTS.md Rule 11.
 */
export function generateDiagnosticsFallback(input: FallbackInput): GeminiAnalysisOutput {
  const desc = (input.description || '').toLowerCase();
  const file = (input.imageFileName || '').toLowerCase();
  const loc = (input.locationText || '').toLowerCase();
  const combined = `${desc} ${file} ${loc}`;

  let raw: GeminiAnalysisOutput;

  if (
    combined.includes('wire') ||
    combined.includes('spark') ||
    combined.includes('shock') ||
    combined.includes('electrical hazard')
  ) {
    raw = {
      issue_title: 'Exposed Electrical Wiring Hazard',
      category: 'Electrical',
      severity: 'critical',
      department: 'Electrical',
      description:
        input.description?.trim() ||
        'Exposed live conductors observed presenting direct fire and electrical shock hazard to campus occupants.',
      safety_risk: true,
      evidence: [
        'Visible physical damage to electrical insulation',
        'Direct hazard in student transit/classroom zone',
        'Immediate electrical isolation required',
      ],
    };
  } else if (
    combined.includes('fan') ||
    combined.includes('blade') ||
    combined.includes('switch') ||
    combined.includes('light') ||
    combined.includes('power')
  ) {
    raw = {
      issue_title: 'Damaged Classroom Ceiling Fan',
      category: 'Electrical',
      severity: 'medium',
      department: 'Electrical',
      description:
        input.description?.trim() ||
        'Ceiling fan exhibits physical wobbling, blade damage, or electrical hum, impairing classroom ventilation.',
      safety_risk: false,
      evidence: [
        'Observable mechanical blade wobble during operation',
        'Directly affects comfort and utility of campus learning area',
      ],
    };
  } else if (
    combined.includes('leak') ||
    combined.includes('water') ||
    combined.includes('pipe') ||
    combined.includes('tap') ||
    combined.includes('drain') ||
    combined.includes('toilet')
  ) {
    raw = {
      issue_title: 'Water Pipe Leakage',
      category: 'Plumbing',
      severity: 'high',
      department: 'Plumbing',
      description:
        input.description?.trim() ||
        'Plumbing fixture or water pipe leaking onto campus floor, creating water wastage and slip hazards.',
      safety_risk: false,
      evidence: [
        'Continuous water seepage from joint or tap',
        'Standing water accumulating in campus facility',
      ],
    };
  } else if (
    combined.includes('projector') ||
    combined.includes('wifi') ||
    combined.includes('network') ||
    combined.includes('internet') ||
    combined.includes('pc') ||
    combined.includes('screen')
  ) {
    raw = {
      issue_title: 'Classroom AV / Projector Malfunction',
      category: 'Classroom Equipment',
      severity: 'medium',
      department: 'IT Support',
      description:
        input.description?.trim() ||
        'Classroom presentation equipment or display projector failing to power on or display HDMI signal.',
      safety_risk: false,
      evidence: [
        'Display unit does not project video output',
        'Directly disrupts scheduled lecture operations',
      ],
    };
  } else if (
    combined.includes('chair') ||
    combined.includes('desk') ||
    combined.includes('bench') ||
    combined.includes('door') ||
    combined.includes('lock') ||
    combined.includes('window')
  ) {
    raw = {
      issue_title: 'Damaged Classroom Furniture',
      category: 'Furniture',
      severity: 'low',
      department: 'Housekeeping',
      description:
        input.description?.trim() ||
        'Classroom furniture or door fixture is fractured, unsteady, or loose, requiring technician repair.',
      safety_risk: false,
      evidence: [
        'Physical structural defect observed on student seating/desk',
        'Requires carpentry or mechanical refitting',
      ],
    };
  } else {
    raw = {
      issue_title: 'Campus Facility Maintenance Report',
      category: 'Other',
      severity: 'medium',
      department: 'Maintenance',
      description:
        input.description?.trim() ||
        'Facility defect observed by student requiring inspection and corrective maintenance by campus staff.',
      safety_risk: false,
      evidence: [
        'Physical disruption reported at campus location',
        'Inspection by department technician requested',
      ],
    };
  }

  return applyDeterministicBusinessRules(raw);
}
