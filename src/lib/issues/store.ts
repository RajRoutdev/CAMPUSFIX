import type { IssueWithRelations, IssueStatus, IssueSeverity } from '@/types/models';
import { PREDEFINED_LOCATIONS } from '@/lib/locations/data';

// In-memory fallback cache for development/demo mode when Supabase credentials are placeholders
const memoryIssues: Map<string, IssueWithRelations> = new Map();
let ticketCounter = 1001;

// Seed initial realistic demo tickets for Apex Institute of Technology
function seedInitialIssues() {
  if (memoryIssues.size > 0) return;

  const collegeId = '11111111-1111-1111-1111-111111111111';
  const studentId = 'e1111111-1111-1111-1111-111111111111';
  const staffId = 'e2222222-2222-2222-2222-222222222222';
  const adminId = 'e3333333-3333-3333-3333-333333333333';
  const electricalDeptId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const plumbingDeptId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  // Demo Issue 1: RESOLUTION_SUBMITTED (Ready for Admin Verification)
  const id1 = 'issue-demo-1001';
  const t1 = 'CF-1001';
  const time1 = new Date(Date.now() - 3600 * 4000).toISOString();
  const resTime1 = new Date(Date.now() - 1800 * 1000).toISOString();

  const issue1: IssueWithRelations = {
    id: id1,
    ticket_number: t1,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Ceiling Fan Blades Wobbling in Room 204',
    description: 'Ceiling fan in Block B Room 204 has severely misaligned blades and makes a loud rattling sound.',
    category: 'Electrical',
    severity: 'medium',
    status: 'RESOLUTION_SUBMITTED',
    department_id: electricalDeptId,
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[0].id,
    created_at: time1,
    updated_at: resTime1,
    resolved_at: null,
    location: PREDEFINED_LOCATIONS[0],
    department: {
      id: electricalDeptId,
      college_id: collegeId,
      name: 'Electrical',
      description: 'Power distribution, lighting, fans',
      created_at: time1,
    },
    assignee: {
      id: staffId,
      college_id: collegeId,
      name: 'Rajesh Kumar (Electrician)',
      email: 'staff@campusfix.edu',
      role: 'staff',
      department_id: electricalDeptId,
      created_at: time1,
    },
    images: [
      {
        id: 'img-1001-orig',
        issue_id: id1,
        image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        image_type: 'original',
        created_at: time1,
      },
      {
        id: 'img-1001-res',
        issue_id: id1,
        image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
        image_type: 'resolution',
        created_at: resTime1,
      },
    ],
    activity_logs: [
      {
        id: 'act-1001-1',
        issue_id: id1,
        user_id: studentId,
        action: 'CREATED',
        metadata: { title: 'Ceiling Fan Blades Wobbling in Room 204', category: 'Electrical', severity: 'medium' },
        created_at: time1,
      },
      {
        id: 'act-1001-2',
        issue_id: id1,
        user_id: adminId,
        action: 'ASSIGNED',
        metadata: { assigned_to: staffId, department: 'Electrical' },
        created_at: new Date(Date.now() - 3000 * 1000).toISOString(),
      },
      {
        id: 'act-1001-3',
        issue_id: id1,
        user_id: staffId,
        action: 'STARTED_WORK',
        metadata: { notes: 'Inspecting fan mounting and motor bracket.' },
        created_at: new Date(Date.now() - 2500 * 1000).toISOString(),
      },
      {
        id: 'act-1001-4',
        issue_id: id1,
        user_id: staffId,
        action: 'RESOLUTION_SUBMITTED',
        metadata: {
          notes: 'Replaced bent blade bracket, balanced blades, and tightened motor anchor bolts. Fan tested operational without vibration.',
          image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
        },
        created_at: resTime1,
      },
    ],
  };

  memoryIssues.set(id1, issue1);
  memoryIssues.set(t1, issue1);

  // Demo Issue 2: IN_PROGRESS (Staff is currently working on it)
  const id2 = 'issue-demo-1002';
  const t2 = 'CF-1002';
  const time2 = new Date(Date.now() - 7200 * 1000).toISOString();

  const issue2: IssueWithRelations = {
    id: id2,
    ticket_number: t2,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Exposed Wiring Near Switchboard',
    description: 'Bare wires visible near the main switchboard in Block B Room 201.',
    category: 'Electrical',
    severity: 'critical',
    status: 'IN_PROGRESS',
    department_id: electricalDeptId,
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[1].id,
    created_at: time2,
    updated_at: new Date(Date.now() - 1200 * 1000).toISOString(),
    resolved_at: null,
    location: PREDEFINED_LOCATIONS[1],
    department: {
      id: electricalDeptId,
      college_id: collegeId,
      name: 'Electrical',
      description: 'Power distribution, lighting, fans',
      created_at: time2,
    },
    assignee: {
      id: staffId,
      college_id: collegeId,
      name: 'Rajesh Kumar (Electrician)',
      email: 'staff@campusfix.edu',
      role: 'staff',
      department_id: electricalDeptId,
      created_at: time2,
    },
    images: [
      {
        id: 'img-1002-orig',
        issue_id: id2,
        image_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&q=80',
        image_type: 'original',
        created_at: time2,
      },
    ],
    activity_logs: [
      {
        id: 'act-1002-1',
        issue_id: id2,
        user_id: studentId,
        action: 'CREATED',
        metadata: { title: 'Exposed Wiring Near Switchboard', category: 'Electrical', severity: 'critical' },
        created_at: time2,
      },
      {
        id: 'act-1002-2',
        issue_id: id2,
        user_id: adminId,
        action: 'ASSIGNED',
        metadata: { assigned_to: staffId },
        created_at: new Date(Date.now() - 5000 * 1000).toISOString(),
      },
      {
        id: 'act-1002-3',
        issue_id: id2,
        user_id: staffId,
        action: 'STARTED_WORK',
        metadata: { notes: 'Power circuit isolated for safety. Commencing conduit replacement.' },
        created_at: new Date(Date.now() - 1200 * 1000).toISOString(),
      },
    ],
  };

  memoryIssues.set(id2, issue2);
  memoryIssues.set(t2, issue2);

  // Demo Issue 3: ASSIGNED (In staff queue awaiting Start Work)
  const id3 = 'issue-demo-1003';
  const t3 = 'CF-1003';
  const time3 = new Date(Date.now() - 1800 * 1000).toISOString();

  const issue3: IssueWithRelations = {
    id: id3,
    ticket_number: t3,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Water Seepage Under Central Library Washbasin',
    description: 'Continuous water leakage from PVC drainage pipe under washbasin.',
    category: 'Plumbing',
    severity: 'high',
    status: 'ASSIGNED',
    department_id: plumbingDeptId,
    assigned_to: null, // Unassigned in department queue
    location_id: PREDEFINED_LOCATIONS[2].id,
    created_at: time3,
    updated_at: time3,
    resolved_at: null,
    location: PREDEFINED_LOCATIONS[2],
    department: {
      id: plumbingDeptId,
      college_id: collegeId,
      name: 'Plumbing',
      description: 'Water supply, drainage, restroom fittings',
      created_at: time3,
    },
    assignee: null,
    images: [
      {
        id: 'img-1003-orig',
        issue_id: id3,
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
        image_type: 'original',
        created_at: time3,
      },
    ],
    activity_logs: [
      {
        id: 'act-1003-1',
        issue_id: id3,
        user_id: studentId,
        action: 'CREATED',
        metadata: { title: 'Water Seepage Under Central Library Washbasin', category: 'Plumbing', severity: 'high' },
        created_at: time3,
      },
      {
        id: 'act-1003-2',
        issue_id: id3,
        user_id: adminId,
        action: 'ASSIGNED',
        metadata: { department: 'Plumbing' },
        created_at: time3,
      },
    ],
  };

  memoryIssues.set(id3, issue3);
  memoryIssues.set(t3, issue3);

  // Demo Issue 4: CLOSED (Room 204 Electrical - Recurring failure)
  const id4 = 'issue-demo-1004';
  const t4 = 'CF-1004';
  const time4 = new Date(Date.now() - 48 * 3600 * 1000).toISOString(); // 2 days ago
  const resTime4 = new Date(Date.now() - 36 * 3600 * 1000).toISOString(); // resolved 36h ago

  const issue4: IssueWithRelations = {
    id: id4,
    ticket_number: t4,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Fluorescent Tube Light Buzzing and Flickering',
    description: 'Tube fixture near whiteboard in Room 204 emits humming noise and strobes intermittently.',
    category: 'Electrical',
    severity: 'medium',
    status: 'CLOSED',
    department_id: electricalDeptId,
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[0].id, // Room 204
    created_at: time4,
    updated_at: resTime4,
    resolved_at: resTime4,
    location: PREDEFINED_LOCATIONS[0],
    department: {
      id: electricalDeptId,
      college_id: collegeId,
      name: 'Electrical',
      description: 'Power distribution, lighting, fans',
      created_at: time4,
    },
    assignee: {
      id: staffId,
      college_id: collegeId,
      name: 'Rajesh Kumar (Electrician)',
      email: 'staff@campusfix.edu',
      role: 'staff',
      department_id: electricalDeptId,
      created_at: time4,
    },
    images: [
      {
        id: 'img-1004-orig',
        issue_id: id4,
        image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
        image_type: 'original',
        created_at: time4,
      },
    ],
    activity_logs: [
      {
        id: 'act-1004-1',
        issue_id: id4,
        user_id: studentId,
        action: 'CREATED',
        metadata: { title: 'Fluorescent Tube Light Buzzing and Flickering' },
        created_at: time4,
      },
      {
        id: 'act-1004-2',
        issue_id: id4,
        user_id: staffId,
        action: 'CLOSED',
        metadata: { notes: 'Replaced ballast and fitted new LED starter tube.' },
        created_at: resTime4,
      },
    ],
  };
  memoryIssues.set(id4, issue4);
  memoryIssues.set(t4, issue4);

  // Demo Issue 5: CLOSED (Room 204 Electrical - 3rd recurring issue)
  const id5 = 'issue-demo-1005';
  const t5 = 'CF-1005';
  const time5 = new Date(Date.now() - 96 * 3600 * 1000).toISOString(); // 4 days ago
  const resTime5 = new Date(Date.now() - 88 * 3600 * 1000).toISOString(); // resolved 8h later

  const issue5: IssueWithRelations = {
    id: id5,
    ticket_number: t5,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Loose AC Switch Box Sparking on Wall',
    description: 'Air conditioner connection box in Room 204 has loose internal terminals.',
    category: 'Electrical',
    severity: 'high',
    status: 'CLOSED',
    department_id: electricalDeptId,
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[0].id, // Room 204
    created_at: time5,
    updated_at: resTime5,
    resolved_at: resTime5,
    location: PREDEFINED_LOCATIONS[0],
    department: {
      id: electricalDeptId,
      college_id: collegeId,
      name: 'Electrical',
      description: 'Power distribution, lighting, fans',
      created_at: time5,
    },
    assignee: {
      id: staffId,
      college_id: collegeId,
      name: 'Rajesh Kumar (Electrician)',
      email: 'staff@campusfix.edu',
      role: 'staff',
      department_id: electricalDeptId,
      created_at: time5,
    },
    images: [],
    activity_logs: [],
  };
  memoryIssues.set(id5, issue5);
  memoryIssues.set(t5, issue5);

  // Demo Issue 6: CLOSED (Computer Lab 1 - Classroom Equipment / IT)
  const id6 = 'issue-demo-1006';
  const t6 = 'CF-1006';
  const time6 = new Date(Date.now() - 14 * 3600 * 1000).toISOString();
  const resTime6 = new Date(Date.now() - 9 * 3600 * 1000).toISOString(); // 5h resolution time

  const issue6: IssueWithRelations = {
    id: id6,
    ticket_number: t6,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Ceiling Projector HDMI Port Not Displaying Video',
    description: 'Ceiling mounted classroom projector displays blue screen despite active HDMI laptop connection.',
    category: 'Classroom Equipment',
    severity: 'medium',
    status: 'CLOSED',
    department_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[4].id, // Computer Lab 1 (Block A)
    created_at: time6,
    updated_at: resTime6,
    resolved_at: resTime6,
    location: PREDEFINED_LOCATIONS[4],
    department: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      college_id: collegeId,
      name: 'IT Support',
      description: 'Networking, computing, projectors',
      created_at: time6,
    },
    images: [],
    activity_logs: [],
  };
  memoryIssues.set(id6, issue6);
  memoryIssues.set(t6, issue6);

  // Demo Issue 7: IN_PROGRESS (Central Library - Plumbing recurring failure)
  const id7 = 'issue-demo-1007';
  const t7 = 'CF-1007';
  const time7 = new Date(Date.now() - 8 * 3600 * 1000).toISOString();

  const issue7: IssueWithRelations = {
    id: id7,
    ticket_number: t7,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Flush Tank Valve Sticking in Library Restroom',
    description: 'Water continuously overflows from flush tank into toilet bowl in Central Library.',
    category: 'Plumbing',
    severity: 'medium',
    status: 'IN_PROGRESS',
    department_id: plumbingDeptId,
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[2].id, // Central Library
    created_at: time7,
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resolved_at: null,
    location: PREDEFINED_LOCATIONS[2],
    department: {
      id: plumbingDeptId,
      college_id: collegeId,
      name: 'Plumbing',
      description: 'Water supply, drainage, restroom fittings',
      created_at: time7,
    },
    assignee: {
      id: staffId,
      college_id: collegeId,
      name: 'Rajesh Kumar (Electrician)',
      email: 'staff@campusfix.edu',
      role: 'staff',
      department_id: plumbingDeptId,
      created_at: time7,
    },
    images: [],
    activity_logs: [],
  };
  memoryIssues.set(id7, issue7);
  memoryIssues.set(t7, issue7);

  // Demo Issue 8: CLOSED (Campus Cafeteria - Cleanliness)
  const id8 = 'issue-demo-1008';
  const t8 = 'CF-1008';
  const time8 = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const resTime8 = new Date(Date.now() - 4 * 3600 * 1000).toISOString(); // 2h resolution time

  const issue8: IssueWithRelations = {
    id: id8,
    ticket_number: t8,
    college_id: collegeId,
    reported_by: studentId,
    title: 'Beverage Spill on Cafeteria Main Walkway',
    description: 'Slippery floor near beverage dispenser station posing slip risk.',
    category: 'Cleanliness',
    severity: 'low',
    status: 'CLOSED',
    department_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    assigned_to: staffId,
    location_id: PREDEFINED_LOCATIONS[5].id, // Campus Cafeteria
    created_at: time8,
    updated_at: resTime8,
    resolved_at: resTime8,
    location: PREDEFINED_LOCATIONS[5],
    department: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      college_id: collegeId,
      name: 'Housekeeping',
      description: 'Cleaning, sanitation, grounds',
      created_at: time8,
    },
    images: [],
    activity_logs: [],
  };
  memoryIssues.set(id8, issue8);
  memoryIssues.set(t8, issue8);

  ticketCounter = 1009;
}

// Initialize seed data
seedInitialIssues();

export function saveInMemoryIssue(issueData: {
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  location_id: string;
  department_id?: string | null;
  reported_by?: string;
  college_id?: string;
  image_url?: string;
  evidence?: string[];
}): IssueWithRelations {
  const id = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const ticketNumber = `CF-${ticketCounter++}`;
  const now = new Date().toISOString();

  const location = PREDEFINED_LOCATIONS.find((l) => l.id === issueData.location_id) || PREDEFINED_LOCATIONS[0];

  const issue: IssueWithRelations = {
    id,
    ticket_number: ticketNumber,
    college_id: issueData.college_id || '11111111-1111-1111-1111-111111111111',
    reported_by: issueData.reported_by || 'e1111111-1111-1111-1111-111111111111',
    title: issueData.title,
    description: issueData.description,
    category: issueData.category,
    severity: issueData.severity,
    status: 'NEW',
    department_id: issueData.department_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    assigned_to: null,
    location_id: location.id,
    created_at: now,
    updated_at: now,
    resolved_at: null,
    location,
    images: issueData.image_url
      ? [
          {
            id: `img-${Date.now()}`,
            issue_id: id,
            image_url: issueData.image_url,
            image_type: 'original',
            created_at: now,
          },
        ]
      : [],
    activity_logs: [
      {
        id: `act-${Date.now()}`,
        issue_id: id,
        user_id: issueData.reported_by || 'e1111111-1111-1111-1111-111111111111',
        action: 'CREATED',
        metadata: {
          title: issueData.title,
          category: issueData.category,
          severity: issueData.severity,
          evidence: issueData.evidence || [],
        },
        created_at: now,
      },
    ],
  };

  memoryIssues.set(id, issue);
  memoryIssues.set(ticketNumber, issue);

  return issue;
}

export function updateInMemoryIssueStatus(
  idOrTicket: string,
  newStatus: IssueStatus,
  userId: string,
  notes?: string
): IssueWithRelations | null {
  const issue = memoryIssues.get(idOrTicket);
  if (!issue) return null;

  const now = new Date().toISOString();
  issue.status = newStatus;
  issue.updated_at = now;

  if (newStatus === 'CLOSED' || newStatus === 'VERIFIED') {
    issue.resolved_at = issue.resolved_at || now;
  }

  const logAction =
    newStatus === 'IN_PROGRESS'
      ? 'STARTED_WORK'
      : newStatus === 'VERIFIED'
      ? 'VERIFIED'
      : newStatus === 'CLOSED'
      ? 'CLOSED'
      : newStatus;

  issue.activity_logs = issue.activity_logs || [];
  issue.activity_logs.unshift({
    id: `act-${Date.now()}`,
    issue_id: issue.id,
    user_id: userId,
    action: logAction,
    metadata: { status: newStatus, notes: notes || '' },
    created_at: now,
  });

  memoryIssues.set(issue.id, issue);
  memoryIssues.set(issue.ticket_number, issue);

  return issue;
}

export function addInMemoryResolution(
  idOrTicket: string,
  resolutionData: {
    notes: string;
    image_url: string;
    userId: string;
  }
): IssueWithRelations | null {
  const issue = memoryIssues.get(idOrTicket);
  if (!issue) return null;

  const now = new Date().toISOString();
  issue.status = 'RESOLUTION_SUBMITTED';
  issue.updated_at = now;

  // Add resolution image
  issue.images = issue.images || [];
  issue.images.push({
    id: `img-res-${Date.now()}`,
    issue_id: issue.id,
    image_url: resolutionData.image_url,
    image_type: 'resolution',
    created_at: now,
  });

  // Add resolution activity log
  issue.activity_logs = issue.activity_logs || [];
  issue.activity_logs.unshift({
    id: `act-res-${Date.now()}`,
    issue_id: issue.id,
    user_id: resolutionData.userId,
    action: 'RESOLUTION_SUBMITTED',
    metadata: {
      notes: resolutionData.notes,
      image_url: resolutionData.image_url,
    },
    created_at: now,
  });

  memoryIssues.set(issue.id, issue);
  memoryIssues.set(issue.ticket_number, issue);

  return issue;
}

export function assignInMemoryIssue(
  idOrTicket: string,
  assignmentData: {
    assigned_to?: string | null;
    department_id?: string | null;
    userId: string;
  }
): IssueWithRelations | null {
  const issue = memoryIssues.get(idOrTicket);
  if (!issue) return null;

  const now = new Date().toISOString();
  if (assignmentData.assigned_to !== undefined) {
    issue.assigned_to = assignmentData.assigned_to;
  }
  if (assignmentData.department_id !== undefined) {
    issue.department_id = assignmentData.department_id;
  }

  // Transition from NEW to ASSIGNED if needed
  if (issue.status === 'NEW') {
    issue.status = 'ASSIGNED';
  }
  issue.updated_at = now;

  issue.activity_logs = issue.activity_logs || [];
  issue.activity_logs.unshift({
    id: `act-assign-${Date.now()}`,
    issue_id: issue.id,
    user_id: assignmentData.userId,
    action: 'ASSIGNED',
    metadata: {
      assigned_to: assignmentData.assigned_to,
      department_id: assignmentData.department_id,
    },
    created_at: now,
  });

  memoryIssues.set(issue.id, issue);
  memoryIssues.set(issue.ticket_number, issue);

  return issue;
}

export function getInMemoryIssues(): IssueWithRelations[] {
  seedInitialIssues();
  const seen = new Set<string>();
  const list: IssueWithRelations[] = [];

  for (const issue of memoryIssues.values()) {
    if (!seen.has(issue.id)) {
      seen.add(issue.id);
      list.push(issue);
    }
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getInMemoryIssueById(id: string): IssueWithRelations | null {
  seedInitialIssues();
  return memoryIssues.get(id) || null;
}

// In-memory issue matches storage
interface MemoryMatch {
  id: string;
  issue_id: string;
  matched_issue_id: string;
  score: number;
  reason: string;
  created_at: string;
}

const memoryMatches: MemoryMatch[] = [];

export function addInMemoryIssueMatch(
  issueId: string,
  matchedIssueId: string,
  score: number,
  reason: string
): MemoryMatch {
  const match: MemoryMatch = {
    id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    issue_id: issueId,
    matched_issue_id: matchedIssueId,
    score,
    reason,
    created_at: new Date().toISOString(),
  };
  memoryMatches.push(match);
  return match;
}

export function getInMemoryIssueMatches(issueId: string): MemoryMatch[] {
  return memoryMatches.filter(
    (m) => m.issue_id === issueId || m.matched_issue_id === issueId
  );
}

export function addInMemoryFollow(
  issueIdOrTicket: string,
  userId: string
): IssueWithRelations | null {
  const issue = getInMemoryIssueById(issueIdOrTicket);
  if (!issue) return null;

  const now = new Date().toISOString();
  issue.activity_logs = issue.activity_logs || [];
  issue.activity_logs.unshift({
    id: `act-sub-${Date.now()}`,
    issue_id: issue.id,
    user_id: userId,
    action: 'SUBSCRIBED',
    metadata: {
      user_id: userId,
      note: 'Student subscribed to follow resolution updates to avoid duplicate ticket clutter',
    },
    created_at: now,
  });

  memoryIssues.set(issue.id, issue);
  memoryIssues.set(issue.ticket_number, issue);
  return issue;
}
