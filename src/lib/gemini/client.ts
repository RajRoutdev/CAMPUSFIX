import {
  GeminiAnalysisSchema,
  GeminiAnalysisOutput,
  AnalyzeResult,
  AnalyzeApiRequest,
} from './schema';
import { applyDeterministicBusinessRules } from './business-rules';
import { generateDiagnosticsFallback } from './fallback';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Server-side Gemini Multimodal Analyzer.
 * Strictly server-side: secrets are never passed to the browser.
 */
export async function analyzeCampusIssue(
  request: AnalyzeApiRequest
): Promise<AnalyzeResult> {
  // Enforce server-side only execution
  if (typeof window !== 'undefined') {
    throw new Error('Gemini API client must only be executed in server environment');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const hasLiveApiKey =
    !!apiKey && !apiKey.toLowerCase().startsWith('placeholder') && apiKey.length > 10;

  // 1. If API Key is missing or placeholder, use transparent diagnostics fallback
  if (!hasLiveApiKey) {
    const fallbackOutput = generateDiagnosticsFallback({
      description: request.description,
      locationText: request.locationText,
      imageFileName: request.imageFileName,
    });

    return {
      ...fallbackOutput,
      is_fallback: true,
      provider: 'fallback-diagnostics',
    };
  }

  // 2. Prepare Multimodal Payload
  const { inlineData, error: imagePrepError } = extractInlineImageData(request.imageData);

  const contextPrompt = buildContextPrompt(request);

  const contents: any[] = [
    {
      role: 'user',
      parts: [
        { text: contextPrompt },
        ...(inlineData ? [inlineData] : []),
      ],
    },
  ];

  const payload = {
    contents,
    system_instruction: {
      parts: [
        {
          text: `You are CampusFix AI, an expert campus facility diagnostics and maintenance assistant for colleges.
Analyze the photo and context of the campus issue reported by the student.
Classify the issue and return ONLY a strict JSON object with these exact fields:
- issue_title: string (concise, professional title, 3-100 characters)
- category: one of ["Electrical", "Plumbing", "Furniture", "Cleanliness", "Internet/Network", "Classroom Equipment", "Security", "Civil/Infrastructure", "Other"]
- severity: one of ["low", "medium", "high", "critical"]
- department: string (e.g., "Electrical", "Plumbing", "IT Support", "Housekeeping", "Maintenance", "Security")
- description: string (clear, evidence-based description, 10-500 characters)
- safety_risk: boolean (true if immediate hazard to students/staff exists)
- evidence: string[] (1 to 5 concise, observable physical facts observed in the photo or context)

IMPORTANT:
- Do NOT include markdown code blocks, backticks, conversational preamble, or internal reasoning/chain-of-thought.
- Output MUST be pure, valid JSON conforming exactly to the requested schema.`,
        },
      ],
    },
    generationConfig: {
      temperature: 0.2,
      response_mime_type: 'application/json',
      max_output_tokens: 1024,
    },
  };

  // 3. Execute Request with Timeout and Retry Behavior
  try {
    const liveResponse = await fetchGeminiWithRetry(apiKey, payload, 2);

    // 4. Clean and Parse JSON Output
    const rawText = liveResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJsonText = cleanModelOutput(rawText);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedJsonText);
    } catch (parseErr) {
      console.warn('[Gemini Client] Failed to parse model JSON output:', rawText);
      throw new Error('Model returned malformed JSON');
    }

    // 5. Schema Validation via Zod
    const validationResult = GeminiAnalysisSchema.safeParse(parsedJson);

    if (!validationResult.success) {
      console.warn(
        '[Gemini Client] Schema validation error:',
        validationResult.error.format()
      );
      throw new Error('Model output failed strict schema validation');
    }

    // 6. Apply Deterministic Business & Safety Rules
    const controlledOutput = applyDeterministicBusinessRules(validationResult.data);

    return {
      ...controlledOutput,
      is_fallback: false,
      provider: 'gemini-1.5-flash',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Gemini error';
    console.warn(`[Gemini Client] Live call failed (${message}). Falling back to diagnostics.`);

    // 7. Controlled Fallback on Error (Rate limits, timeouts, schema violations)
    const fallbackOutput = generateDiagnosticsFallback({
      description: request.description,
      locationText: request.locationText,
      imageFileName: request.imageFileName,
    });

    return {
      ...fallbackOutput,
      is_fallback: true,
      provider: 'fallback-diagnostics',
    };
  }
}

/**
 * Executes fetch to Gemini REST API with AbortSignal timeout and single retry
 */
async function fetchGeminiWithRetry(
  apiKey: string,
  payload: unknown,
  maxAttempts = 2
): Promise<any> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        // Handle rate limiting (429) or transient server errors (500, 503)
        if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
          console.warn(`[Gemini Client] HTTP ${response.status}. Retrying attempt ${attempt + 1}...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(`Gemini API HTTP ${response.status}: ${errorBody.slice(0, 150)}`);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError') {
        throw new Error('Gemini API request timed out after 15 seconds');
      }
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error('Failed to communicate with Gemini API');
}

/**
 * Extracts pure base64 and MIME type from a data URL or raw string
 */
function extractInlineImageData(imageData?: string): {
  inlineData: { inline_data: { mime_type: string; data: string } } | null;
  error: string | null;
} {
  if (!imageData || typeof imageData !== 'string') {
    return { inlineData: null, error: null };
  }

  // Format: data:image/png;base64,iVBORw0KGgo...
  if (imageData.startsWith('data:')) {
    const parts = imageData.split(';base64,');
    if (parts.length === 2) {
      const mime = parts[0].replace('data:', '').trim() || 'image/jpeg';
      const base64 = parts[1].trim();
      return {
        inlineData: {
          inline_data: {
            mime_type: mime,
            data: base64,
          },
        },
        error: null,
      };
    }
  }

  // Raw base64 string
  if (imageData.length > 50 && !imageData.includes(' ')) {
    return {
      inlineData: {
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageData,
        },
      },
      error: null,
    };
  }

  return { inlineData: null, error: 'Unrecognized image data format' };
}

/**
 * Builds user context prompt combining location, student notes, and instructions
 */
function buildContextPrompt(request: AnalyzeApiRequest): string {
  const parts: string[] = ['Please analyze this campus issue report:'];

  if (request.locationText) {
    parts.push(`Campus Location: ${request.locationText}`);
  }

  if (request.description) {
    parts.push(`Student's Note/Description: "${request.description}"`);
  }

  if (request.imageFileName) {
    parts.push(`Photo File Name: ${request.imageFileName}`);
  }

  parts.push(
    'Identify the specific facility defect, categorize it, determine appropriate urgency/severity, suggest the maintenance department, and provide observable evidence items.'
  );

  return parts.join('\n');
}

/**
 * Strips accidental markdown fences from model response
 */
function cleanModelOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}
