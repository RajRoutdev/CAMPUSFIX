import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getInMemoryIssueById,
  assignInMemoryIssue,
} from '@/lib/issues/store';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate Request
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Role Guard: Only administrators can assign or reassign tickets
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only campus administrators can assign or re-route tickets' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const assigned_to = body.assigned_to !== undefined ? body.assigned_to : undefined;
    const department_id = body.department_id !== undefined ? body.department_id : undefined;

    // 2. Fetch Existing Issue
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

    // Tenant Isolation
    if (
      existingIssue.college_id &&
      profile.college_id &&
      existingIssue.college_id !== profile.college_id
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-college ticket assignment is prohibited' },
        { status: 403 }
      );
    }

    // 3. Update Assignment
    let updatedIssue = null;

    try {
      const supabase = getDatabaseClient();
      const now = new Date().toISOString();
      const updatePayload: any = { updated_at: now };

      if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
      if (department_id !== undefined) updatePayload.department_id = department_id;
      if (existingIssue.status === 'NEW') updatePayload.status = 'ASSIGNED';

      const { data, error } = await supabase
        .from('issues')
        .update(updatePayload)
        .eq('id', existingIssue.id)
        .select('*, location:locations(*), department:departments(*), assignee:profiles!assigned_to(*)')
        .single();

      if (!error && data) {
        await supabase.from('activity_logs').insert({
          issue_id: existingIssue.id,
          user_id: userId,
          action: 'ASSIGNED',
          metadata: { assigned_to, department_id },
        });

        updatedIssue = data;
      }
    } catch {
      // Supabase unavailable
    }

    // Always synchronize in-memory store
    const memUpdated = assignInMemoryIssue(existingIssue.id, {
      assigned_to,
      department_id,
      userId,
    });
    if (!updatedIssue) {
      updatedIssue = memUpdated;
    }

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to assign issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
