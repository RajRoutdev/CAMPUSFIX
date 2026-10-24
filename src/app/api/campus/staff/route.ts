import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import {
  getCollegeStaffProfiles,
  getCollegeInvitations,
  createStaffInvitation,
  toggleStaffActiveStatus,
  DEFAULT_COLLEGE_ID,
} from '@/lib/campus/store';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const collegeId = profile.college_id || DEFAULT_COLLEGE_ID;
    const staff = getCollegeStaffProfiles(collegeId);
    const invitations = getCollegeInvitations(collegeId);

    return NextResponse.json({ success: true, staff, invitations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch staff list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { email, name, department_id, designation, service_areas, expires_in_days } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid staff email is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Staff member name is required' }, { status: 400 });
    }

    const invitation = createStaffInvitation(collegeId, {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      department_id: department_id || undefined,
      designation: designation ? designation.trim() : undefined,
      service_areas: Array.isArray(service_areas) ? service_areas : undefined,
      expires_in_days: expires_in_days ? parseInt(expires_in_days, 10) : 7,
      invited_by: userId,
    });

    return NextResponse.json({
      success: true,
      message: `Staff invitation issued for ${invitation.email}`,
      invitation,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to invite staff member';
    return NextResponse.json({ error: message }, { status: 400 });
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

    const body = await req.json();
    const { targetUserId, is_active } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (is_active === undefined) {
      return NextResponse.json({ error: 'is_active boolean is required' }, { status: 400 });
    }

    const updated = toggleStaffActiveStatus(targetUserId, Boolean(is_active));
    if (!updated) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Staff access ${updated.is_active ? 'activated' : 'deactivated'} for ${updated.name}`,
      profile: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update staff status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
