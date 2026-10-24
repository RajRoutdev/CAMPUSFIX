import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import { uploadIssueImage } from '@/lib/supabase/storage';
import { saveInMemoryIssue, getInMemoryIssues } from '@/lib/issues/store';
import { getSuggestedDepartmentForCategory, getLocationById } from '@/lib/campus/store';
import { PREDEFINED_LOCATIONS } from '@/lib/locations/data';
import { IssueWithRelations } from '@/types/models';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const departmentFilter = searchParams.get('department_id');
    const assignedFilter = searchParams.get('assigned_to');
    const searchQuery = searchParams.get('search')?.toLowerCase().trim();

    // 1. Fetch from Supabase via getDatabaseClient()
    let dbIssues: IssueWithRelations[] = [];
    try {
      const supabase = getDatabaseClient();
      let query = supabase
        .from('issues')
        .select(`
          *,
          location:locations(*),
          department:departments(*),
          reporter:profiles!reported_by(*),
          assignee:profiles!assigned_to(*),
          images:issue_images(*),
          activity_logs:activity_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'student') {
        // Query issues reported by the student OR followed by the student in activity_logs
        const { data: followedLogs } = await supabase
          .from('activity_logs')
          .select('issue_id')
          .eq('user_id', userId)
          .eq('action', 'SUBSCRIBED');

        const followedIds = followedLogs?.map((l) => l.issue_id).filter(Boolean) || [];
        if (followedIds.length > 0) {
          query = query.or(`reported_by.eq.${userId},id.in.(${followedIds.join(',')})`);
        } else {
          query = query.eq('reported_by', userId);
        }
      } else if (profile.college_id) {
        query = query.eq('college_id', profile.college_id);
      }

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter as any);
      }
      if (categoryFilter && categoryFilter !== 'ALL') {
        query = query.eq('category', categoryFilter);
      }
      if (departmentFilter && departmentFilter !== 'ALL') {
        query = query.eq('department_id', departmentFilter);
      }
      if (assignedFilter) {
        query = query.eq('assigned_to', assignedFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        dbIssues = data as IssueWithRelations[];
      }
    } catch {
      // Supabase unavailable; proceed with in-memory issues
    }

    // 2. Fetch scoped in-memory issues
    let memoryIssues = getInMemoryIssues();
    if (profile.college_id) {
      memoryIssues = memoryIssues.filter((i) => !i.college_id || i.college_id === profile.college_id);
    }
    if (profile.role === 'student') {
      memoryIssues = memoryIssues.filter(
        (i) =>
          i.reported_by === userId ||
          i.activity_logs?.some(
            (log) => log.user_id === userId && log.action === 'SUBSCRIBED'
          )
      );
    } else if (profile.role === 'staff') {
      memoryIssues = memoryIssues.filter(
        (i) =>
          i.assigned_to === userId ||
          (profile.department_id && i.department_id === profile.department_id) ||
          !i.assigned_to
      );
    }

    // 3. Merge Supabase and in-memory issues (deduplicate by both ticket_number and id)
    const seen = new Set<string>();
    const merged: IssueWithRelations[] = [];
    for (const item of [...dbIssues, ...memoryIssues]) {
      const key = item.ticket_number || item.id;
      if (!seen.has(key) && !seen.has(item.id)) {
        seen.add(key);
        seen.add(item.id);
        merged.push(item);
      }
    }

    const filteredIssues = applyFilters(
      merged,
      statusFilter,
      categoryFilter,
      departmentFilter,
      assignedFilter,
      searchQuery
    );

    // Sanitize list view images so list payloads don't transmit megabytes of base64
    const sanitizedForList = filteredIssues.map((issue) => {
      if (!issue.images || issue.images.length === 0) return issue;
      return {
        ...issue,
        images: issue.images.map((img) => ({
          ...img,
          image_url: img.image_url?.startsWith('data:image/') && img.image_url.length > 300
            ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23f1f5f9"/></svg>'
            : img.image_url,
        })),
      };
    });

    return NextResponse.json({ issues: sanitizedForList });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issues';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function applyFilters(
  list: IssueWithRelations[],
  status?: string | null,
  category?: string | null,
  department_id?: string | null,
  assigned_to?: string | null,
  search?: string | null
): IssueWithRelations[] {
  return list.filter((issue) => {
    if (status && status !== 'ALL' && issue.status !== status) {
      return false;
    }
    if (category && category !== 'ALL' && issue.category !== category) {
      return false;
    }
    if (department_id && department_id !== 'ALL' && issue.department_id !== department_id) {
      return false;
    }
    if (assigned_to && issue.assigned_to !== assigned_to) {
      return false;
    }
    if (search) {
      const matchTicket = issue.ticket_number?.toLowerCase().includes(search);
      const matchTitle = issue.title?.toLowerCase().includes(search);
      const matchDesc = issue.description?.toLowerCase().includes(search);
      const matchRoom = issue.location?.room?.toLowerCase().includes(search);
      const matchBuilding = issue.location?.building?.toLowerCase().includes(search);
      if (!matchTicket && !matchTitle && !matchDesc && !matchRoom && !matchBuilding) {
        return false;
      }
    }
    return true;
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'General';
    const severity = ['low', 'medium', 'high', 'critical'].includes(body.severity) ? body.severity : 'medium';
    const location_id = typeof body.location_id === 'string' ? body.location_id.trim() : '';
    const image_url = typeof body.image_url === 'string' ? body.image_url.trim() : '';
    const evidence = Array.isArray(body.evidence) ? body.evidence : [];
    const matched_issue_id = typeof body.matched_issue_id === 'string' ? body.matched_issue_id.trim() : null;
    const match_score = typeof body.match_score === 'number' ? body.match_score : null;
    const match_reason = typeof body.match_reason === 'string' ? body.match_reason.trim() : null;

    // 2. Strict Input Validation (PRD Section 9 mandates photo and location)
    if (!title) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }
    if (!location_id) {
      return NextResponse.json({ error: 'Campus location is required' }, { status: 400 });
    }
    if (!image_url) {
      return NextResponse.json({ error: 'Photo of issue is required' }, { status: 400 });
    }

    const reported_by = userId;
    const college_id = profile.college_id || '11111111-1111-1111-1111-111111111111';
    const routedDept = getSuggestedDepartmentForCategory(college_id, category);
    const department_id = (typeof body.department_id === 'string' && body.department_id.trim())
      ? body.department_id.trim()
      : (routedDept?.id || null);

    // Upload image to Supabase Storage if data URI, returning clean CDN URL
    let finalImageUrl = image_url;
    if (image_url && image_url.startsWith('data:image/')) {
      finalImageUrl = await uploadIssueImage(image_url, 'original');
    }

    let createdIssue: IssueWithRelations | null = null;

    // 3. Try live Supabase insertion via getDatabaseClient()
    try {
      const supabase = getDatabaseClient();

      // Ensure student profile exists in profiles table so foreign key constraint is satisfied
      await supabase.from('profiles').upsert({
        id: reported_by,
        college_id: college_id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department_id: profile.department_id || null,
      }, { onConflict: 'id' });

      // Ensure location exists in database if valid location object found
      const locObj = getLocationById(location_id) || PREDEFINED_LOCATIONS.find((l) => l.id === location_id);
      if (locObj) {
        await supabase.from('locations').upsert({
          id: locObj.id,
          college_id: college_id,
          building: locObj.building,
          floor: locObj.floor,
          room: locObj.room,
          area: locObj.area || null,
        }, { onConflict: 'id' });
      }

      const { data: issue, error: issueError }: { data: any; error: any } = await (supabase
        .from('issues')
        .insert({
          title,
          description,
          category,
          severity,
          status: 'NEW',
          location_id,
          college_id,
          reported_by,
          department_id,
        })
        .select('*, location:locations(*), department:departments(*)')
        .single() as any);

      if (!issueError && issue) {
        // Link image if provided
        if (finalImageUrl) {
          await supabase.from('issue_images').insert({
            issue_id: issue.id,
            image_url: finalImageUrl,
            image_type: 'original',
          });
        }

        // Link duplicate match if user created new report after duplicate warning
        if (matched_issue_id && match_score !== null) {
          await supabase.from('issue_matches').insert({
            issue_id: issue.id,
            matched_issue_id,
            score: match_score,
            reason: match_reason || 'Student confirmed creation despite potential duplicate alert',
          });
        }

        // Add activity log
        await supabase.from('activity_logs').insert({
          issue_id: issue.id,
          user_id: reported_by,
          action: 'CREATED',
          metadata: {
            title,
            category,
            severity,
            evidence,
            potential_duplicate_of: matched_issue_id,
            match_score,
          },
        });

        createdIssue = issue as IssueWithRelations;
      }
    } catch {
      // Supabase is offline or connection is unavailable; proceed with in-memory synchronization
    }

    // 4. Synchronize with in-memory store so both layers remain 100% consistent
    const memIssue = saveInMemoryIssue({
      id: createdIssue?.id,
      ticket_number: createdIssue?.ticket_number,
      title,
      description,
      category,
      severity,
      location_id,
      department_id: department_id || undefined,
      reported_by,
      college_id,
      image_url: finalImageUrl,
      evidence,
    });

    if (matched_issue_id && match_score !== null) {
      const { addInMemoryIssueMatch } = await import('@/lib/issues/store');
      addInMemoryIssueMatch(
        (createdIssue || memIssue).id,
        matched_issue_id,
        match_score,
        match_reason || 'Student confirmed creation despite potential duplicate alert'
      );
    }

    if (!createdIssue) {
      createdIssue = memIssue;
    }

    return NextResponse.json({ success: true, issue: createdIssue }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
