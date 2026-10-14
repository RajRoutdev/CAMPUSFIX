import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { analyzeCampusIssue } from '@/lib/gemini/client';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request (Security Rule: Prevent unauthenticated AI endpoint consumption)
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Sign in required to analyze issues' },
        { status: 401 }
      );
    }

    // 2. Validate Payload
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const locationText = typeof body.locationText === 'string' ? body.locationText.trim() : '';
    const imageFileName = typeof body.imageFileName === 'string' ? body.imageFileName.trim() : '';
    const imageData = typeof body.imageData === 'string' ? body.imageData : undefined;

    // Check payload size (limit to ~10MB to protect memory)
    if (imageData && imageData.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Uploaded image exceeds maximum size limit (10MB)' },
        { status: 400 }
      );
    }

    if (!imageData && !description) {
      return NextResponse.json(
        { error: 'Please provide a photo or description of the campus issue' },
        { status: 400 }
      );
    }

    // 3. Multimodal Analysis through Server-side Gemini Pipeline
    const analysis = await analyzeCampusIssue({
      imageData,
      imageFileName,
      description,
      locationText,
    });

    return NextResponse.json(analysis, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
