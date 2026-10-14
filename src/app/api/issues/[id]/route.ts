import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getInMemoryIssueById } from '@/lib/issues/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check in-memory store first
    const memoryIssue = getInMemoryIssueById(id);
    if (memoryIssue) {
      return NextResponse.json({ issue: memoryIssue });
    }

    // Try Supabase
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
        return NextResponse.json({ issue: data });
      }
    } catch {
      // Supabase unavailable
    }

    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
