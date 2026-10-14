import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getInMemoryIssueById } from '@/lib/issues/store';
import { IssueWithRelations } from '@/types/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate Request
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    let issue: IssueWithRelations | null = null;

    // 2. Check in-memory store
    const memoryIssue = getInMemoryIssueById(id);
    if (memoryIssue) {
      issue = memoryIssue;
    }

    // 3. Try Supabase if not in memory
    if (!issue) {
      try {
        const supabase = createServerSupabaseClient();
        const isTicketNumber = id.startsWith('CF-');

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
          `);

        if (isTicketNumber) {
          query = query.eq('ticket_number', id);
        } else {
          query = query.eq('id', id);
        }

        const { data, error } = await query.single();
        if (!error && data) {
          issue = data as IssueWithRelations;
        }
      } catch {
        // Supabase unavailable or using placeholder configuration
      }
    }

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // 4. Multi-College Tenant Isolation
    if (issue.college_id && profile.college_id && issue.college_id !== profile.college_id) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-college access is strictly prohibited' },
        { status: 403 }
      );
    }

    // 5. Data Ownership Check: Students can only view their own reported tickets
    if (profile.role === 'student' && issue.reported_by !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Students may only access their own reported issues' },
        { status: 403 }
      );
    }

    return NextResponse.json({ issue });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
