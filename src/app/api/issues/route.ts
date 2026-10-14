import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { saveInMemoryIssue, getInMemoryIssues } from '@/lib/issues/store';
import { IssueWithRelations } from '@/types/models';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // 1. In-memory issues scoped by user role & ownership
    let memoryIssues = getInMemoryIssues();
    if (profile.role === 'student') {
      memoryIssues = memoryIssues.filter((i) => i.reported_by === userId);
    } else if (profile.college_id) {
      memoryIssues = memoryIssues.filter((i) => i.college_id === profile.college_id);
    }

    // 2. Try Supabase if configured
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase
        .from('issues')
        .select(`
          *,
          location:locations(*),
          images:issue_images(*),
          activity_logs:activity_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (profile.role === 'student') {
        query = query.eq('reported_by', userId);
      } else if (profile.college_id) {
        query = query.eq('college_id', profile.college_id);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const seen = new Set<string>();
        const merged: IssueWithRelations[] = [];
        for (const item of [...data, ...memoryIssues]) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item as IssueWithRelations);
          }
        }
        return NextResponse.json({ issues: merged });
      }
    } catch {
      // Supabase unavailable or placeholder, return scoped memory issues
    }

    return NextResponse.json({ issues: memoryIssues });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch issues';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

    let createdIssue: IssueWithRelations | null = null;

    // 3. Try live Supabase insertion
    try {
      const supabase = createServerSupabaseClient();
      const { data: issue, error: issueError } = await supabase
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
        })
        .select('*, location:locations(*)')
        .single();

      if (!issueError && issue) {
        // Link image if provided
        if (image_url) {
          await supabase.from('issue_images').insert({
            issue_id: issue.id,
            image_url,
            image_type: 'original',
          });
        }

        // Add activity log
        await supabase.from('activity_logs').insert({
          issue_id: issue.id,
          user_id: reported_by,
          action: 'CREATED',
          metadata: { title, category, severity, evidence },
        });

        createdIssue = issue as IssueWithRelations;
      }
    } catch {
      // Supabase is using placeholder credentials or connection is unavailable
    }

    // 4. Fallback to in-memory store if live Supabase is not connected
    if (!createdIssue) {
      createdIssue = saveInMemoryIssue({
        title,
        description,
        category,
        severity,
        location_id,
        reported_by,
        college_id,
        image_url,
        evidence,
      });
    }

    return NextResponse.json({ success: true, issue: createdIssue }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create issue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
