import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getCollegeLocations,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  DEFAULT_COLLEGE_ID,
} from '@/lib/campus/store';
import { LocationType } from '@/types/models';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('building_id') || undefined;
    const includeInactive = searchParams.get('include_inactive') === 'true' && profile.role === 'admin';

    const collegeId = profile.college_id || DEFAULT_COLLEGE_ID;
    let locations = getCollegeLocations(collegeId, buildingId, includeInactive);

    // Try live Supabase sync
    try {
      const supabase = getDatabaseClient();
      let query = supabase.from('locations').select('*').eq('college_id', collegeId);
      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }
      if (!includeInactive) {
        query = query.neq('is_active', false);
      }
      const { data } = await query;
      if (data && data.length > 0) {
        const seen = new Set(locations.map((l) => l.id));
        for (const item of (data as any[])) {
          if (!seen.has(item.id)) {
            locations.push(item);
            seen.add(item.id);
          }
        }
      }
    } catch {
      // Fallback to in-memory store
    }

    return NextResponse.json({ success: true, locations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch locations';
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

    const { building_id, building, floor, room, area, location_type } = body;

    if (!building || typeof building !== 'string' || !building.trim()) {
      return NextResponse.json({ error: 'Building name is required' }, { status: 400 });
    }

    if (!floor || typeof floor !== 'string' || !floor.trim()) {
      return NextResponse.json({ error: 'Floor is required (e.g., Ground Floor, Floor 2, Outdoor)' }, { status: 400 });
    }

    if (!room || typeof room !== 'string' || !room.trim()) {
      return NextResponse.json({ error: 'Room or Area name is required' }, { status: 400 });
    }

    const loc = createLocation(collegeId, {
      building_id: building_id || undefined,
      building: building.trim(),
      floor: floor.trim(),
      room: room.trim(),
      area: area ? area.trim() : undefined,
      location_type: (location_type as LocationType) || 'classroom',
    });

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('locations').upsert({
        id: loc.id,
        college_id: collegeId,
        building: loc.building,
        floor: loc.floor,
        room: loc.room,
        area: loc.area || null,
        building_id: loc.building_id || null,
        location_type: loc.location_type || 'classroom',
        is_active: loc.is_active !== false,
      }, { onConflict: 'id' });
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, location: loc }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create location';
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
    const { id, building_id, building, floor, room, area, location_type, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (building_id !== undefined) updates.building_id = building_id;
    if (building !== undefined) updates.building = building.trim();
    if (floor !== undefined) updates.floor = floor.trim();
    if (room !== undefined) updates.room = room.trim();
    if (area !== undefined) updates.area = area ? area.trim() : null;
    if (location_type !== undefined) updates.location_type = location_type;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const updated = updateLocation(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await (supabase.from('locations').update(updates as any) as any).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, location: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update location';
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
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    const deactivated = toggleLocationStatus(id, false);
    if (!deactivated) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('locations').update({ is_active: false }).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({
      success: true,
      message: `Location "${deactivated.room} (${deactivated.building})" safely deactivated`,
      location: deactivated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate location';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
