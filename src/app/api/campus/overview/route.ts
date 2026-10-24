import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import {
  getCollegeDetails,
  getCollegeBuildings,
  getCollegeLocations,
  getCollegeDepartments,
  getCollegeStaffProfiles,
  getCollegeInvitations,
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
    const college = getCollegeDetails(collegeId);
    const buildings = getCollegeBuildings(collegeId, true);
    const locations = getCollegeLocations(collegeId, undefined, true);
    const departments = getCollegeDepartments(collegeId, true);
    const staff = getCollegeStaffProfiles(collegeId);
    const invitations = getCollegeInvitations(collegeId);

    return NextResponse.json({
      success: true,
      college,
      stats: {
        totalBuildings: buildings.length,
        activeBuildings: buildings.filter((b) => b.is_active).length,
        totalLocations: locations.length,
        activeLocations: locations.filter((l) => l.is_active !== false).length,
        totalDepartments: departments.length,
        activeDepartments: departments.filter((d) => d.is_active !== false).length,
        totalStaff: staff.length,
        activeStaff: staff.filter((s) => s.is_active !== false).length,
        pendingInvitations: invitations.filter((i) => !i.is_used && new Date(i.expires_at) > new Date()).length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch campus overview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
