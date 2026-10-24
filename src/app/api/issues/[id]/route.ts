import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import { getInMemoryIssueById } from '@/lib/issues/store';
import { IssueWithRelations } from '@/types/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // 2. Try Supabase first via getDatabaseClient()
    try {
      const supabase = getDatabaseClient();
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
      // Supabase unavailable; check in-memory store
    }

    // 3. Fallback to in-memory store if not found in database
    if (!issue) {
      const memoryIssue = getInMemoryIssueById(id);
      if (memoryIssue) {
        issue = memoryIssue;
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

    // 5. Data Ownership Check: Students can only view their own reported tickets or tickets they follow
    if (profile.role === 'student' && issue.reported_by !== userId) {
      const isFollower = issue.activity_logs?.some(
        (log) => log.user_id === userId && log.action === 'SUBSCRIBED'
      );
      if (!isFollower) {
        return NextResponse.json(
          { error: 'Forbidden: Students may only access their own reported or followed issues' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ issue });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
