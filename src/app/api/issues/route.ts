import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { saveInMemoryIssue, getInMemoryIssues } from '@/lib/issues/store';
import { IssueWithRelations } from '@/types/models';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const departmentFilter = searchParams.get('department_id');
    const assignedFilter = searchParams.get('assigned_to');
    const searchQuery = searchParams.get('search')?.toLowerCase().trim();

    // 1. In-memory issues scoped by user role & tenant
    let memoryIssues = getInMemoryIssues();

    // Tenant / College isolation
    if (profile.college_id) {
      memoryIssues = memoryIssues.filter((i) => !i.college_id || i.college_id === profile.college_id);
    }

    // Role-specific scoping
    if (profile.role === 'student') {
      memoryIssues = memoryIssues.filter((i) => i.reported_by === userId);
    } else if (profile.role === 'staff') {
      // Staff see assigned issues or department issues
      memoryIssues = memoryIssues.filter(
        (i) =>
          i.assigned_to === userId ||
          (profile.department_id && i.department_id === profile.department_id) ||
          !i.assigned_to
      );
    }

    // 2. Try Supabase if configured
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase
        .from('issues')
        .select(`
          *,
          location:locations(*),
          department:departments(*),
          reporter:profiles!reported_by(*),
          assignee:profiles!assigned_to(*),
          images:issue_images(*),
          activity_logs:activity_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'student') {
        query = query.eq('reported_by', userId);
      } else if (profile.college_id) {
        query = query.eq('college_id', profile.college_id);
      }

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter as any);
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        query = query.eq('category', categoryFilter);
      }
      if (departmentFilter && departmentFilter !== 'ALL') {
        query = query.eq('department_id', departmentFilter);
      }
      if (assignedFilter) {
        query = query.eq('assigned_to', assignedFilter);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const seen = new Set<string>();
        const merged: IssueWithRelations[] = [];
        for (const item of [...data, ...memoryIssues]) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item as IssueWithRelations);
          }
        }
        return NextResponse.json({ issues: applyFilters(merged, statusFilter, categoryFilter, departmentFilter, assignedFilter, searchQuery) });
      }
    } catch {
      // Supabase unavailable or placeholder, return scoped memory issues
    }

    const filteredMemoryIssues = applyFilters(
      memoryIssues,
      statusFilter,
      categoryFilter,
      departmentFilter,
      assignedFilter,
      searchQuery
    );

    return NextResponse.json({ issues: filteredMemoryIssues });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issues';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function applyFilters(
  list: IssueWithRelations[],
  status?: string | null,
  category?: string | null,
  department_id?: string | null,
  assigned_to?: string | null,
  search?: string | null
): IssueWithRelations[] {
  return list.filter((issue) => {
    if (status && status !== 'ALL' && issue.status !== status) {
      return false;
    }
    if (category && category !== 'ALL' && issue.category !== category) {
      return false;
    }
    if (department_id && department_id !== 'ALL' && issue.department_id !== department_id) {
      return false;
    }
    if (assigned_to && issue.assigned_to !== assigned_to) {
      return false;
    }
    if (search) {
      const matchTicket = issue.ticket_number?.toLowerCase().includes(search);
      const matchTitle = issue.title?.toLowerCase().includes(search);
      const matchDesc = issue.description?.toLowerCase().includes(search);
      const matchRoom = issue.location?.room?.toLowerCase().includes(search);
      const matchBuilding = issue.location?.building?.toLowerCase().includes(search);
      if (!matchTicket && !matchTitle && !matchDesc && !matchRoom && !matchBuilding) {
        return false;
      }
    }
    return true;
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'General';
    const severity = ['low', 'medium', 'high', 'critical'].includes(body.severity) ? body.severity : 'medium';
    const location_id = typeof body.location_id === 'string' ? body.location_id.trim() : '';
    const image_url = typeof body.image_url === 'string' ? body.image_url.trim() : '';
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const matched_issue_id = typeof body.matched_issue_id === 'string' ? body.matched_issue_id.trim() : null;
    const match_score = typeof body.match_score === 'number' ? body.match_score : null;
    const match_reason = typeof body.match_reason === 'string' ? body.match_reason.trim() : null;

    // 2. Strict Input Validation (PRD Section 9 mandates photo and location)
    if (!title) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }
    if (!location_id) {
      return NextResponse.json({ error: 'Campus location is required' }, { status: 400 });
    }
    if (!image_url) {
      return NextResponse.json({ error: 'Photo of issue is required' }, { status: 400 });
    }

    const reported_by = userId;
    const college_id = profile.college_id || '11111111-1111-1111-1111-111111111111';

    let createdIssue: IssueWithRelations | null = null;

    // 3. Try live Supabase insertion
    try {
      const supabase = createServerSupabaseClient();
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          title,
          description,
          category,
          severity,
          status: 'NEW',
          location_id,
          college_id,
          reported_by,
        })
        .select('*, location:locations(*)')
        .single();

      if (!issueError && issue) {
        // Link image if provided
        if (image_url) {
          await supabase.from('issue_images').insert({
            issue_id: issue.id,
            image_url,
            image_type: 'original',
          });
        }

        // Link duplicate match if user created new report after duplicate warning
        if (matched_issue_id && match_score !== null) {
          await supabase.from('issue_matches').insert({
            issue_id: issue.id,
            matched_issue_id,
            score: match_score,
            reason: match_reason || 'Student confirmed creation despite potential duplicate alert',
          });
        }

        // Add activity log
        await supabase.from('activity_logs').insert({
          issue_id: issue.id,
          user_id: reported_by,
          action: 'CREATED',
          metadata: {
            title,
            category,
            severity,
            evidence,
            potential_duplicate_of: matched_issue_id,
            match_score,
          },
        });

        createdIssue = issue as IssueWithRelations;
      }
    } catch {
      // Supabase is using placeholder credentials or connection is unavailable
    }

    // 4. Fallback to in-memory store if live Supabase is not connected
    if (!createdIssue) {
      createdIssue = saveInMemoryIssue({
        title,
        description,
        category,
        severity,
        location_id,
        reported_by,
        college_id,
        image_url,
        evidence,
      });

      if (matched_issue_id && match_score !== null) {
        const { addInMemoryIssueMatch } = await import('@/lib/issues/store');
        addInMemoryIssueMatch(
          createdIssue.id,
          matched_issue_id,
          match_score,
          match_reason || 'Student confirmed creation despite potential duplicate alert'
        );
      }
    }

    return NextResponse.json({ success: true, issue: createdIssue }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
