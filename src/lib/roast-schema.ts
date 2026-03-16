import { z } from 'zod'

export const roastResultSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('Code quality score from 0.0 (terrible) to 10.0 (perfect)'),
  verdict: z.enum(['needs_serious_help', 'bad', 'mediocre', 'decent', 'clean_code']),
  roastQuote: z
    .string()
    .describe('A short, memorable phrase summarizing the review (max ~150 chars)'),
  issues: z
    .array(
      z.object({
        severity: z.enum(['critical', 'warning', 'good']),
        title: z.string(),
        description: z.string(),
      }),
    )
    .describe(
      'List of issues found, from most severe to least. Include positive points with severity "good" if applicable',
    ),
  suggestedDiff: z
    .string()
    .nullable()
    .describe('Unified diff showing the most important fix, or null if not applicable'),
  diffFileName: z
    .string()
    .nullable()
    .describe('Suggested filename for the diff, or null if not applicable'),
})
