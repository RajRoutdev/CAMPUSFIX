import { z } from 'zod';

export const CategoryEnum = z.enum([
  'Electrical',
  'Plumbing',
  'Furniture',
  'Cleanliness',
  'Internet/Network',
  'Classroom Equipment',
  'Security',
  'Civil/Infrastructure',
  'Other',
]);

export const SeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Strict schema for Gemini multimodal analysis output.
 * Follows PRD Section 10 and AGENTS.md rules.
 * Does not include chain-of-thought or internal reasoning.
 */
export const GeminiAnalysisSchema = z.object({
  issue_title: z
    .string()
    .min(3, 'Issue title must be at least 3 characters')
    .max(100, 'Issue title cannot exceed 100 characters'),
  category: CategoryEnum,
  severity: SeverityEnum,
  department: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(50, 'Department name cannot exceed 50 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  safety_risk: z.boolean(),
  evidence: z
    .array(z.string().min(3).max(200))
    .min(1, 'At least 1 observable evidence point is required')
    .max(5, 'Maximum of 5 evidence points allowed'),
});

export type GeminiAnalysisOutput = z.infer<typeof GeminiAnalysisSchema>;

export interface AnalyzeResult extends GeminiAnalysisOutput {
  is_fallback: boolean;
  provider: 'gemini-1.5-flash' | 'gemini-2.5-flash' | 'gemini-flash-latest' | 'fallback-diagnostics' | string;
}

export interface AnalyzeApiRequest {
  imageData?: string; // base64 data URL (e.g. data:image/jpeg;base64,...)
  imageFileName?: string;
  description?: string;
  locationText?: string;
}
