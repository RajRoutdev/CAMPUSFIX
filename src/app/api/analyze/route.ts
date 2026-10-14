import { NextRequest, NextResponse } from 'next/server';
import { generateMockAiAnalysis } from '@/lib/mock-ai/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const description = typeof body.description === 'string' ? body.description : '';
    const locationText = typeof body.locationText === 'string' ? body.locationText : '';
    const imageFileName = typeof body.imageFileName === 'string' ? body.imageFileName : '';

    // Phase 2: Deterministic Mock AI analysis conforming to PRD Section 10 schema
    const analysis = generateMockAiAnalysis({
      description,
      locationText,
      imageFileName,
    });

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
