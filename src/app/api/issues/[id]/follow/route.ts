import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getInMemoryIssueById,
  addInMemoryFollow,
} from '@/lib/issues/store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate caller
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // 2. Fetch existing issue
    let existingIssue = getInMemoryIssueById(id);
    if (!existingIssue) {
      try {
        const supabase = getDatabaseClient();
        const isTicket = id.startsWith('CF-');
        const query = isTicket
          ? supabase.from('issues').select('*').eq('ticket_number', id).single()
          : supabase.from('issues').select('*').eq('id', id).single();
        const { data } = await query;
        if (data) existingIssue = data as any;
      } catch {
        // Supabase unavailable
      }
    }

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // 3. Multi-college tenant isolation
    if (
      existingIssue.college_id &&
      profile.college_id &&
      existingIssue.college_id !== profile.college_id
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-college ticket subscription is prohibited' },
        { status: 403 }
      );
    }

    // 4. Record follow activity in activity_logs
    try {
      const supabase = getDatabaseClient();
      await supabase.from('activity_logs').insert({
        issue_id: existingIssue.id,
        user_id: userId,
        action: 'SUBSCRIBED',
        metadata: {
          follower_name: profile.name,
          follower_email: profile.email,
          reason: 'Student opted to follow existing issue to prevent duplicate clutter',
        },
      });
    } catch {
      // Supabase unavailable
    }

    // Also update in-memory store
    const updated = addInMemoryFollow(existingIssue.id, userId);

    return NextResponse.json({
      success: true,
      message: `You are now following updates for ticket ${existingIssue.ticket_number}`,
      issue: updated || existingIssue,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to follow issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
