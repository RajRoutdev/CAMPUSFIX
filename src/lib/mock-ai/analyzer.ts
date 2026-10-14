export interface AiAnalysisResult {
  issue_title: string;
  category: 'Electrical' | 'Plumbing' | 'Furniture' | 'Cleanliness' | 'Internet/Network' | 'Classroom Equipment' | 'Security' | 'Civil/Infrastructure' | 'Other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  description: string;
  safety_risk: boolean;
  evidence: string[];
  is_mock: boolean;
}

interface AnalyzeInput {
  description?: string;
  locationText?: string;
  imageFileName?: string;
}

export function generateMockAiAnalysis(input: AnalyzeInput): AiAnalysisResult {
  const text = (input.description || '').toLowerCase();
  const loc = (input.locationText || '').toLowerCase();

  // 1. Water / Plumbing
  if (text.includes('leak') || text.includes('water') || text.includes('tap') || text.includes('pipe') || text.includes('sink')) {
    return {
      issue_title: 'Water Pipe Leakage',
      category: 'Plumbing',
      severity: text.includes('flood') || text.includes('major') ? 'high' : 'medium',
      department: 'Plumbing',
      description: 'Water leakage observed at fitting causing pooling and potential slip hazard.',
      safety_risk: text.includes('flood') || text.includes('major'),
      evidence: [
        'Visible water dripping from connection point',
        'Water pooling on floor beneath fixture',
        'Affects facility hygiene and access',
      ],
      is_mock: true,
    };
  }

  // 2. Wi-Fi / Projector / IT
  if (text.includes('wifi') || text.includes('internet') || text.includes('projector') || text.includes('network') || text.includes('cable') || text.includes('screen')) {
    return {
      issue_title: text.includes('projector') ? 'Classroom Projector Malfunction' : 'Wi-Fi Signal Drop',
      category: text.includes('projector') ? 'Classroom Equipment' : 'Internet/Network',
      severity: 'medium',
      department: 'IT Support',
      description: text.includes('projector')
        ? 'Projector lamp is not powering on, interrupting classroom presentations.'
        : 'Access point is unreachable from classroom student devices.',
      safety_risk: false,
      evidence: [
        'Equipment status LED indicates connection loss',
        'Directly hinders scheduled academic lectures',
      ],
      is_mock: true,
    };
  }

  // 3. Furniture / Cleanliness / Civil
  if (text.includes('chair') || text.includes('desk') || text.includes('bench') || text.includes('door') || text.includes('lock') || text.includes('window')) {
    return {
      issue_title: 'Damaged Student Desk / Chair',
      category: 'Furniture',
      severity: 'low',
      department: 'Housekeeping',
      description: 'Furniture fixture has loose joint or broken armrest requiring carpenter repair.',
      safety_risk: false,
      evidence: [
        'Structural bolt is missing or detached',
        'Unstable seating surface for students',
      ],
      is_mock: true,
    };
  }

  // 4. Critical Safety / Electrical hazard
  if (text.includes('spark') || text.includes('exposed wire') || text.includes('shock') || text.includes('fire')) {
    return {
      issue_title: 'Exposed Electrical Wiring Hazard',
      category: 'Electrical',
      severity: 'critical',
      department: 'Electrical',
      description: 'Exposed live wiring detected presenting acute shock and fire risk to students.',
      safety_risk: true,
      evidence: [
        'Bare copper conductors visibly exposed',
        'Located in student transit area',
        'Immediate safety isolation required',
      ],
      is_mock: true,
    };
  }

  // 5. Default Hackathon Demo Standard Scenario: Broken Ceiling Fan in Block B Room 204
  return {
    issue_title: 'Broken Ceiling Fan',
    category: 'Electrical',
    severity: 'medium',
    department: 'Electrical',
    description: 'Ceiling fan appears physically damaged and does not rotate properly, affecting room ventilation.',
    safety_risk: false,
    evidence: [
      'Fan blades show noticeable physical misalignment',
      'Unit produces humming noise without rotational movement',
      'Affects classroom ventilation and student comfort',
    ],
    is_mock: true,
  };
}
