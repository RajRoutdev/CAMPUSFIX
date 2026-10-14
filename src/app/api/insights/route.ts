import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getInMemoryIssues } from '@/lib/issues/store';
import { calculateCampusAnalytics } from '@/lib/analytics/engine';

export async function GET(req: NextRequest) {
  try {
    const { userId, profile } = await getCurrentUser();
    if (!userId || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (profile.role !== 'admin' && profile.role !== 'staff') {
      return NextResponse.json(
        { error: 'Forbidden: Leadership insights restricted to administrative personnel' },
        { status: 403 }
      );
    }

    // 1. Compute deterministic metrics first (Rule 25: AI does not invent numbers)
    const memoryPool = getInMemoryIssues().filter(
      (i) => !profile.college_id || !i.college_id || i.college_id === profile.college_id
    );
    const analytics = calculateCampusAnalytics(memoryPool);

    const topHotspot = analytics.building_hotspots[0]?.building || 'Block B';
    const topRecurring = analytics.recurring_issues[0]?.summary || 'Room 204 has repeated electrical fixture repairs';
    const totalVolume = analytics.summary.total_issues;
    const criticalCount = analytics.summary.critical_issues;
    const avgHours = analytics.summary.average_resolution_hours;

    // 2. Deterministic baseline summary (reliable fallback)
    const deterministicInsight = `${topHotspot} represents the highest concentration of campus facility requests, with ${topRecurring.toLowerCase()}. Prioritizing scheduled preventive maintenance in ${topHotspot} and addressing chronic fixture wear will reduce overall ticket volume and improve classroom uptime.`;

    let finalInsight = deterministicInsight;
    let isAiGenerated = false;

    // 3. Optional: Use Gemini to synthesize natural-language executive brief
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'placeholder_key' && !apiKey.startsWith('demo_')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const prompt = `You are a campus facilities operations analyst. Summarize these verified metrics in 2 concise, executive sentences for college administration. DO NOT alter or invent numbers.
Verified Metrics:
- Total Campus Issues: ${totalVolume}
- Critical / Safety Hazards: ${criticalCount}
- Average Resolution Time: ${avgHours} hours
- Top Building Hotspot: ${topHotspot}
- Top Recurring Problem: ${topRecurring}`;

        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 150, temperature: 0.2 },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText) {
            finalInsight = generatedText;
            isAiGenerated = true;
          }
        }
      } catch {
        // Use verified deterministic summary on network or timeout failure
      }
    }

    return NextResponse.json({
      success: true,
      insight: finalInsight,
      is_ai_generated: isAiGenerated,
      provider: isAiGenerated ? 'gemini-1.5-flash' : 'deterministic-executive-summary',
      computed_metrics: {
        total_issues: totalVolume,
        top_hotspot: topHotspot,
        avg_resolution_hours: avgHours,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating insights';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
