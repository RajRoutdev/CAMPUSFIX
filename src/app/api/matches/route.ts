import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDatabaseClient } from '@/lib/supabase/db';
import { getInMemoryIssues } from '@/lib/issues/store';
import { PREDEFINED_LOCATIONS } from '@/lib/locations/data';
import { getLocationById } from '@/lib/campus/store';
import {
  findDuplicateCandidates,
  DEFAULT_DUPLICATE_THRESHOLD,
  DuplicateInput,
} from '@/lib/duplicates/detector';
import { IssueWithRelations } from '@/types/models';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const location_id = typeof body.location_id === 'string' ? body.location_id.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const threshold =
      typeof body.threshold === 'number' && body.threshold > 0 && body.threshold <= 1
        ? body.threshold
        : DEFAULT_DUPLICATE_THRESHOLD;

    if (!location_id || !title) {
      return NextResponse.json(
        { error: 'location_id and title are required for duplicate analysis' },
        { status: 400 }
      );
    }

    // 2. Resolve location object
    const locationObj =
      getLocationById(location_id) ||
      PREDEFINED_LOCATIONS.find((l) => l.id === location_id) ||
      null;

    const duplicateInput: DuplicateInput = {
      title,
      description,
      category,
      location_id,
      college_id: profile.college_id,
      location: locationObj,
    };

    // 3. Fetch candidate issues within same college
    let candidatesPool: IssueWithRelations[] = [];

    // First check in-memory store
    const memoryPool = getInMemoryIssues().filter(
      (i) => !profile.college_id || !i.college_id || i.college_id === profile.college_id
    );
    candidatesPool = [...memoryPool];

    // Try Supabase if configured
    try {
      const supabase = getDatabaseClient();
      let query = supabase
        .from('issues')
        .select(`
          *,
          location:locations(*),
          department:departments(*),
          reporter:profiles!reported_by(*),
          images:issue_images(*),
          activity_logs:activity_logs(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (profile.college_id) {
        query = query.eq('college_id', profile.college_id);
      }
      query = query.neq('status', 'CLOSED');

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const seenIds = new Set(candidatesPool.map((i) => i.id));
        for (const item of (data as any[])) {
          if (!seenIds.has(item.id)) {
            candidatesPool.push(item as IssueWithRelations);
            seenIds.add(item.id);
          }
        }
      }
    } catch {
      // Supabase unavailable; proceed with in-memory pool
    }

    // 4. Run Duplicate Detection Algorithm
    const matchResult = findDuplicateCandidates(duplicateInput, candidatesPool, threshold);

    return NextResponse.json({
      success: true,
      has_match: matchResult.has_match,
      threshold: matchResult.threshold,
      match: matchResult.best_match,
      top_candidate: matchResult.best_match,
      candidates: matchResult.candidates,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Duplicate detection error';
    // Graceful degradation: never block reporting if duplicate check errors
    return NextResponse.json(
      {
        success: false,
        has_match: false,
        threshold: DEFAULT_DUPLICATE_THRESHOLD,
        match: null,
        candidates: [],
        error: message,
      },
      { status: 200 }
    );
  }
}
