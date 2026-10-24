import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getCollegeBuildings,
  createBuilding,
  updateBuilding,
  toggleBuildingStatus,
  DEFAULT_COLLEGE_ID,
} from '@/lib/campus/store';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('include_inactive') === 'true' && profile.role === 'admin';

    const collegeId = profile.college_id || DEFAULT_COLLEGE_ID;
    let buildings = getCollegeBuildings(collegeId, includeInactive);

    // Try live Supabase sync
    try {
      const supabase = getDatabaseClient();
      let query = supabase.from('buildings').select('*').eq('college_id', collegeId);
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data } = await query;
      if (data && data.length > 0) {
        const seen = new Set(buildings.map((b) => b.id));
        for (const item of (data as any[])) {
          if (!seen.has(item.id)) {
            buildings.push(item);
            seen.add(item.id);
          }
        }
      }
    } catch {
      // Fallback to in-memory store
    }

    return NextResponse.json({ success: true, buildings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch buildings';
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

    const { name, code, total_floors } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Building name is required' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Building code is required (e.g., BLK-A)' }, { status: 400 });
    }

    const floors = total_floors !== undefined ? parseInt(total_floors, 10) : 1;
    if (isNaN(floors) || floors < 0) {
      return NextResponse.json({ error: 'total_floors must be a non-negative number' }, { status: 400 });
    }

    const building = createBuilding(collegeId, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      total_floors: floors,
    });

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('buildings').upsert({
        id: building.id,
        college_id: collegeId,
        name: building.name,
        code: building.code,
        total_floors: building.total_floors,
        is_active: building.is_active,
      }, { onConflict: 'id' });
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, building }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create building';
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
    const { id, name, code, total_floors, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Building name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (code !== undefined) {
      if (typeof code !== 'string' || !code.trim()) {
        return NextResponse.json({ error: 'Building code cannot be empty' }, { status: 400 });
      }
      updates.code = code.trim().toUpperCase();
    }

    if (total_floors !== undefined) {
      const floors = parseInt(total_floors, 10);
      if (isNaN(floors) || floors < 0) {
        return NextResponse.json({ error: 'total_floors must be a non-negative number' }, { status: 400 });
      }
      updates.total_floors = floors;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    const updated = updateBuilding(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Building not found or code already in use' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await (supabase.from('buildings').update(updates as any) as any).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, building: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update building';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
    }

    const deactivated = toggleBuildingStatus(id, false);
    if (!deactivated) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('buildings').update({ is_active: false }).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({
      success: true,
      message: `Building "${deactivated.name}" safely deactivated`,
      building: deactivated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate building';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
