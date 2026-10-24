import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import {
  parseAndValidateCsv,
  commitParsedImport,
  DEFAULT_COLLEGE_ID,
} from '@/lib/campus/store';

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

    const { type, csvData, dryRun = false } = body;

    if (!type || !['buildings', 'locations', 'departments'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type. Must be "buildings", "locations", or "departments".' },
        { status: 400 }
      );
    }

    if (!csvData || typeof csvData !== 'string' || !csvData.trim()) {
      return NextResponse.json({ error: 'CSV data string is required' }, { status: 400 });
    }

    // Parse and validate with column check, duplicate check, and parent-child check
    const validationResult = parseAndValidateCsv(collegeId, type, csvData);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        preview: true,
        summary: {
          totalRows: validationResult.totalRows,
          validCount: validationResult.validRows.length,
          errorCount: validationResult.errorRows.length,
          duplicatesDetected: validationResult.duplicatesDetected,
        },
        validRows: validationResult.validRows,
        errorRows: validationResult.errorRows,
      });
    }

    // Commit import
    if (validationResult.validRows.length === 0) {
      return NextResponse.json({
        error: 'No valid records found to import.',
        summary: {
          totalRows: validationResult.totalRows,
          validCount: 0,
          errorCount: validationResult.errorRows.length,
          duplicatesDetected: validationResult.duplicatesDetected,
        },
        errorRows: validationResult.errorRows,
      }, { status: 400 });
    }

    const { insertedCount } = commitParsedImport(collegeId, type, validationResult.validRows);

    return NextResponse.json({
      success: true,
      preview: false,
      message: `Successfully imported ${insertedCount} ${type} record(s).`,
      insertedCount,
      summary: {
        totalRows: validationResult.totalRows,
        validCount: validationResult.validRows.length,
        errorCount: validationResult.errorRows.length,
        duplicatesDetected: validationResult.duplicatesDetected,
      },
      errorRows: validationResult.errorRows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bulk CSV import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
