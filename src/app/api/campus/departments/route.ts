import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import {
  getCollegeDepartments,
  createDepartment,
  updateDepartment,
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
    let departments = getCollegeDepartments(collegeId, includeInactive);

    // Try live Supabase sync
    try {
      const supabase = getDatabaseClient();
      let query = supabase.from('departments').select('*').eq('college_id', collegeId);
      if (!includeInactive) {
        query = query.neq('is_active', false);
      }
      const { data } = await query;
      if (data && data.length > 0) {
        const seen = new Set(departments.map((d) => d.id));
        for (const item of (data as any[])) {
          if (!seen.has(item.id)) {
            departments.push(item);
            seen.add(item.id);
          }
        }
      }
    } catch {
      // Fallback to in-memory store
    }

    return NextResponse.json({ success: true, departments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch departments';
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

    const { name, description, categories, default_routing_rule } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const dept = createDepartment(collegeId, {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      categories: Array.isArray(categories) ? categories : [],
      default_routing_rule: default_routing_rule ? default_routing_rule.trim() : undefined,
    });

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('departments').upsert({
        id: dept.id,
        college_id: collegeId,
        name: dept.name,
        description: dept.description || null,
        categories: dept.categories || [],
        default_routing_rule: dept.default_routing_rule || null,
        is_active: dept.is_active !== false,
      }, { onConflict: 'id' });
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, department: dept }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create department';
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
    const { id, name, description, categories, default_routing_rule, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (categories !== undefined) updates.categories = Array.isArray(categories) ? categories : [];
    if (default_routing_rule !== undefined) updates.default_routing_rule = default_routing_rule.trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const updated = updateDepartment(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await (supabase.from('departments').update(updates as any) as any).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({ success: true, department: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update department';
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
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const deactivated = updateDepartment(id, { is_active: false });
    if (!deactivated) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Sync to Supabase
    try {
      const supabase = getDatabaseClient();
      await supabase.from('departments').update({ is_active: false }).eq('id', id);
    } catch {
      // Proceed with in-memory store
    }

    return NextResponse.json({
      success: true,
      message: `Department "${deactivated.name}" safely deactivated`,
      department: deactivated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate department';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
