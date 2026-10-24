import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getInMemoryIssueById,
  updateInMemoryIssueStatus,
} from '@/lib/issues/store';
import { IssueStatus } from '@/types/models';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: IssueStatus[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLUTION_SUBMITTED',
  'VERIFIED',
  'CLOSED',
];

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

    // Students are not permitted to change ticket lifecycle status
    if (profile.role === 'student') {
      return NextResponse.json(
        { error: 'Forbidden: Students cannot alter ticket lifecycle status' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = body.status as IssueStatus;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

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

    // 3. Tenant Isolation
    if (
      existingIssue.college_id &&
      profile.college_id &&
      existingIssue.college_id !== profile.college_id
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-college status modification is prohibited' },
        { status: 403 }
      );
    }

    // 4. Role-Based Status Transition Validation (AGENTS.md Section 13)
    if (profile.role === 'staff') {
      // Staff can start work: ASSIGNED -> IN_PROGRESS
      const isAllowedStaffTransition =
        (existingIssue.status === 'ASSIGNED' || existingIssue.status === 'NEW') &&
        newStatus === 'IN_PROGRESS';

      if (!isAllowedStaffTransition) {
        return NextResponse.json(
          {
            error:
              'Forbidden: Staff can only transition tickets to IN_PROGRESS. Resolution proof upload is required for resolution.',
          },
          { status: 403 }
        );
      }
    }

    // 5. Apply Status Update
    let updatedIssue = null;

    // Try Supabase first via getDatabaseClient()
    try {
      const supabase = getDatabaseClient();
      const now = new Date().toISOString();
      const updateData: any = {
        status: newStatus,
        updated_at: now,
      };

      if (newStatus === 'VERIFIED' || newStatus === 'CLOSED') {
        updateData.resolved_at = now;
      }

      const { data, error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', existingIssue.id)
        .select('*, location:locations(*), department:departments(*)')
        .single();

      if (!error && data) {
        const logAction =
          newStatus === 'IN_PROGRESS'
            ? 'STARTED_WORK'
            : newStatus === 'VERIFIED'
            ? 'VERIFIED'
            : newStatus === 'CLOSED'
            ? 'CLOSED'
            : newStatus;

        await supabase.from('activity_logs').insert({
          issue_id: existingIssue.id,
          user_id: userId,
          action: logAction,
          metadata: { status: newStatus, notes },
        });

        updatedIssue = data;
      }
    } catch {
      // Supabase unavailable
    }

    // Always synchronize in-memory store
    const memUpdated = updateInMemoryIssueStatus(existingIssue.id, newStatus, userId, notes);
    if (!updatedIssue) {
      updatedIssue = memUpdated;
    }

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
