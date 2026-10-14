import type { IssueWithRelations } from '@/types/models';
import { PREDEFINED_LOCATIONS } from '@/lib/locations/data';

// In-memory fallback cache for development/demo mode when Supabase credentials are placeholders
const memoryIssues: Map<string, IssueWithRelations> = new Map();
let ticketCounter = 1001;

export function saveInMemoryIssue(issueData: {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

export function getInMemoryIssues(): IssueWithRelations[] {
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
  return memoryIssues.get(id) || null;
}
