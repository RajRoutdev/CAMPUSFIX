import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getCollegeDetails,
  updateCollegeDetails,
  DEFAULT_COLLEGE_ID,
} from '@/lib/campus/store';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const collegeId = profile.college_id || DEFAULT_COLLEGE_ID;
    let college = getCollegeDetails(collegeId);

    // Try live Supabase sync
    try {
      const supabase = getDatabaseClient();
      const { data } = await supabase.from('colleges').select('*').eq('id', collegeId).single();
      if (data) {
        college = {
          ...college,
          ...data,
        };
      }
    } catch {
      // Fallback to in-memory store
    }

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, college });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch college details';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const collegeId = profile.college_id || DEFAULT_COLLEGE_ID;
    const body = await req.json();

    const allowedUpdates = ['name', 'campus_name', 'address', 'city', 'state', 'is_active', 'logo_url'];
    const filteredUpdates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        filteredUpdates[key] = body[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    if (filteredUpdates.name !== undefined && !filteredUpdates.name.trim()) {
      return NextResponse.json({ error: 'College name cannot be empty' }, { status: 400 });
    }

    const updated = updateCollegeDetails(collegeId, filteredUpdates);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update college details' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await (supabase.from('colleges').update(filteredUpdates as any) as any).eq('id', collegeId);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, college: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update college details';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
