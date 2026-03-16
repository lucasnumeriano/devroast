import { createOpenAI } from '@ai-sdk/openai'
import { Output, streamText } from 'ai'
import { and, eq } from 'drizzle-orm'
import { after } from 'next/server'
import { db } from '@/db'
import { roastIssues, roasts } from '@/db/schema'
import { roastResultSchema } from '@/lib/roast-schema'

export const maxDuration = 60

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SYSTEM_PROMPT_BASE = `You are a brutally honest code reviewer. Analyze the provided code and return a structured evaluation.

Rules:
- score: 0.0 to 10.0 where 0 is terrible code and 10 is perfect
- verdict: based on score (0-2: needs_serious_help, 2-4: bad, 4-6: mediocre, 6-8: decent, 8-10: clean_code)
- roastQuote: a short, memorable phrase summarizing the evaluation (max ~150 chars)
- issues: list problems found, from most severe to least. Include positive points with severity "good" if any exist
- suggestedDiff: if relevant, provide a unified diff showing the most important correction. Set to null if not applicable.
- diffFileName: suggested filename for the diff. Set to null if no diff is provided.

Always respond in English.`

const ROAST_MODE_ADDITION = `
ROAST MODE ACTIVATED: Be maximum sarcastic and funny.
The roastQuote should be a memorable joke/burn about the code.
Issue descriptions should have acid humor.
Keep the technical analysis accurate, but with a stand-up comedy tone roasting the code.`

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Walk the error cause chain to build a full message string for pattern matching.
 * AI SDK wraps provider errors (e.g. AI_RetryError -> AI_APICallError),
 * so the top-level message may not contain rate-limit keywords.
 */
function collectErrorMessages(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error

  while (current) {
    if (current instanceof Error) {
      parts.push(current.message)

      const anyErr = current as unknown as Record<string, unknown>
      if (typeof anyErr.responseBody === 'string') {
        parts.push(anyErr.responseBody)
      }

      current = current.cause
    } else if (typeof current === 'object' && current !== null) {
      // Handle plain objects (e.g. OpenAI SSE error events:
      // { type: 'error', error: { type: 'insufficient_quota', message: '...' } })
      parts.push(JSON.stringify(current))
      break
    } else {
      parts.push(String(current))
      break
    }
  }

  return parts.join(' ')
}

function isRateLimitError(error: unknown): boolean {
  const fullMessage = collectErrorMessages(error)
  return (
    fullMessage.includes('429') ||
    fullMessage.includes('rate_limit') ||
    fullMessage.includes('Rate limit') ||
    fullMessage.includes('quota') ||
    fullMessage.includes('insufficient_quota')
  )
}

function extractRetryDelay(error: unknown): number {
  const fullMessage = collectErrorMessages(error)
  const match = fullMessage.match(/retry\s+in\s+([\d.]+)s/i)
  return match ? Math.ceil(Number.parseFloat(match[1])) : 60
}

async function markAsFailed(id: string) {
  await db
    .update(roasts)
    .set({ status: 'failed' })
    .where(and(eq(roasts.id, id), eq(roasts.status, 'pending')))
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return Response.json({ error: 'invalid roast id' }, { status: 400 })
  }

  // Fetch roast from DB
  const [roast] = await db.select().from(roasts).where(eq(roasts.id, id)).limit(1)

  if (!roast) {
    return Response.json({ error: 'roast not found' }, { status: 404 })
  }

  if (roast.status !== 'pending') {
    return Response.json({ error: 'roast already processed' }, { status: 409 })
  }

  // Build prompts
  const systemPrompt = roast.roastMode
    ? SYSTEM_PROMPT_BASE + ROAST_MODE_ADDITION
    : SYSTEM_PROMPT_BASE

  const userPrompt = `Language: ${roast.language}

Code:
\`\`\`${roast.language}
${roast.code}
\`\`\``

  try {
    // Capture any stream-level error so we can inspect it if the stream closes
    // before producing any output (e.g. quota errors sent as SSE events).
    let streamError: unknown = null

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      output: Output.object({ schema: roastResultSchema }),
      temperature: roast.roastMode ? 0.8 : 0.3,
      maxRetries: 1,
      onError({ error }) {
        console.error('Stream error:', error)
        streamError = error
        after(async () => {
          await markAsFailed(id)
        })
      },
      onFinish() {
        after(async () => {
          try {
            const output = await result.output
            if (!output) {
              await markAsFailed(id)
              return
            }

            // Save result to DB (with WHERE status = 'pending' to prevent duplicate writes)
            await db
              .update(roasts)
              .set({
                score: output.score,
                verdict: output.verdict,
                roastQuote: output.roastQuote,
                suggestedDiff: output.suggestedDiff ?? null,
                diffFileName: output.diffFileName ?? null,
                status: 'completed',
              })
              .where(and(eq(roasts.id, id), eq(roasts.status, 'pending')))

            // Insert issues
            if (output.issues.length > 0) {
              await db.insert(roastIssues).values(
                output.issues.map((issue, i) => ({
                  roastId: id,
                  severity: issue.severity,
                  title: issue.title,
                  description: issue.description,
                  position: i,
                })),
              )
            }
          } catch (error) {
            console.error('Failed to save roast result:', error)
            await markAsFailed(id)
          }
        })
      },
    })

    // Build the stream response but read the first chunk before committing.
    // OpenAI's Responses API may return a 200 connection and then send
    // quota/rate-limit errors as stream events. By reading the first chunk,
    // we can detect these errors and return a proper JSON error response
    // instead of an empty 200 stream.
    const streamResponse = result.toTextStreamResponse()
    const reader = streamResponse.body?.getReader()

    if (!reader) {
      await markAsFailed(id)
      return Response.json({ error: 'something went wrong' }, { status: 500 })
    }

    const firstRead = await reader.read()
    if (firstRead.done) {
      // Stream ended immediately with no data — the provider sent an error
      // as a stream event (e.g. insufficient_quota) instead of an HTTP error.
      reader.releaseLock()
      await markAsFailed(id)

      if (streamError && isRateLimitError(streamError)) {
        const retrySeconds = extractRetryDelay(streamError)
        return Response.json({ error: 'rate_limit', retry: retrySeconds }, { status: 429 })
      }

      return Response.json({ error: 'something went wrong' }, { status: 500 })
    }

    // Re-wrap the stream: push the first chunk back, then pipe the rest.
    const passthrough = new ReadableStream({
      async start(controller) {
        controller.enqueue(firstRead.value)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
          controller.close()
        } catch {
          controller.close()
        }
      },
    })

    return new Response(passthrough, {
      headers: streamResponse.headers,
    })
  } catch (error) {
    console.error('Failed to start stream:', error)
    await markAsFailed(id)

    if (isRateLimitError(error)) {
      const retrySeconds = extractRetryDelay(error)
      return Response.json({ error: 'rate_limit', retry: retrySeconds }, { status: 429 })
    }

    return Response.json({ error: 'something went wrong' }, { status: 500 })
  }
}
