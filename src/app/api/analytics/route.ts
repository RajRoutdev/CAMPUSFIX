import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getInMemoryIssues } from '@/lib/issues/store';
import { calculateCampusAnalytics } from '@/lib/analytics/engine';
import { IssueWithRelations } from '@/types/models';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Role guard: Admin or Staff can inspect campus operations
    if (profile.role !== 'admin' && profile.role !== 'staff') {
      return NextResponse.json(
        { error: 'Forbidden: Analytics portal restricted to administrative personnel' },
        { status: 403 }
      );
    }

    // 2. Fetch all issues scoped strictly by authenticated user's college
    let collegeIssues: IssueWithRelations[] = [];

    // Memory store fallback
    const memoryPool = getInMemoryIssues().filter(
      (i) => !profile.college_id || !i.college_id || i.college_id === profile.college_id
    );
    collegeIssues = [...memoryPool];

    // Try Supabase if configured
    try {
      const supabase = createServerSupabaseClient();
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

      if (profile.college_id) {
        query = query.eq('college_id', profile.college_id);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const seen = new Set(collegeIssues.map((i) => i.id));
        for (const item of (data as any[])) {
          if (!seen.has(item.id)) {
            collegeIssues.push(item as IssueWithRelations);
            seen.add(item.id);
          }
        }
      }
    } catch {
      // Supabase unavailable; proceed with in-memory college issues
    }

    // 3. Compute deterministic analytics metrics
    const analytics = calculateCampusAnalytics(collegeIssues);

    return NextResponse.json({
      success: true,
      college_id: profile.college_id,
      analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate campus analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
