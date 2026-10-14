import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getInMemoryIssueById,
  addInMemoryResolution,
} from '@/lib/issues/store';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate Caller
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Role check: Only Staff or Admin can submit resolution proof
    if (profile.role !== 'staff' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only technicians or campus administrators can submit work resolutions' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const image_url = typeof body.image_url === 'string' ? body.image_url.trim() : '';

    if (!notes) {
      return NextResponse.json(
        { error: 'Resolution notes describing the completed repair work are required' },
        { status: 400 }
      );
    }

    if (!image_url) {
      return NextResponse.json(
        { error: 'Photo evidence of the physical resolution is strictly required' },
        { status: 400 }
      );
    }

    // 2. Fetch Existing Issue
    let existingIssue = getInMemoryIssueById(id);
    if (!existingIssue) {
      try {
        const supabase = createServerSupabaseClient();
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
        { error: 'Forbidden: Cross-college resolution submission is prohibited' },
        { status: 403 }
      );
    }

    // 3. Persist Resolution Evidence
    let updatedIssue = null;

    // Try live Supabase insertion
    try {
      const supabase = createServerSupabaseClient();
      const now = new Date().toISOString();

      // Update issue status to RESOLUTION_SUBMITTED
      const { data: issueData, error: updateErr } = await supabase
        .from('issues')
        .update({
          status: 'RESOLUTION_SUBMITTED',
          updated_at: now,
        })
        .eq('id', existingIssue.id)
        .select('*, location:locations(*), department:departments(*)')
        .single();

      if (!updateErr && issueData) {
        // Insert resolution proof image
        await supabase.from('issue_images').insert({
          issue_id: existingIssue.id,
          image_url,
          image_type: 'resolution',
        });

        // Insert activity log
        await supabase.from('activity_logs').insert({
          issue_id: existingIssue.id,
          user_id: userId,
          action: 'RESOLUTION_SUBMITTED',
          metadata: { notes, image_url },
        });

        updatedIssue = issueData;
      }
    } catch {
      // Supabase unavailable or using placeholder configuration
    }

    // Fallback to in-memory store
    if (!updatedIssue) {
      updatedIssue = addInMemoryResolution(existingIssue.id, {
        notes,
        image_url,
        userId,
      });
    }

    return NextResponse.json(
      { success: true, message: 'Resolution evidence submitted for verification', issue: updatedIssue },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit resolution';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
