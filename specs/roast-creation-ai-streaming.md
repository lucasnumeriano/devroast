# Roast Creation with AI Streaming

## Overview

Enable the core feature of devroast: users paste code, submit it for analysis, and see AI-generated roast results streamed progressively to the result page.

## User Flow

1. User types/pastes code on the homepage into the existing CodeMirror editor
2. Optionally toggles roast mode (on by default) and selects language (auto-detected by default)
3. Clicks `$ roast_my_code`
4. Server Action validates input and applies rate limiting (5 roasts/hour per IP)
5. Server Action creates a `pending` roast record in the DB, returns `{ id }`
6. Client navigates to `/roast/[id]`
7. Page detects `status === 'pending'`, renders `RoastStreamView` (client component)
8. `RoastStreamView` calls `submit()` from `useObject` (via `useEffect` on mount) to POST to `/api/roast/[id]/stream`
9. API Route calls Gemini 2.0 Flash via `streamObject` (Vercel AI SDK v5)
10. Partial results stream in progressively: score, verdict, roastQuote, issues (one by one), suggestedDiff
11. On stream completion, API Route saves the full result to the DB and marks `status: 'completed'`
12. If the user reloads the page later, the roast loads from DB via the existing server-side path

## Out of Scope

- Share roast functionality
- Authentication / user accounts
- Roast editing or deletion

## Database Changes

### Extend enum: `language`

The current `languageEnum` has 10 values but the editor supports 20. Extend to include all editor languages:

Current: `javascript`, `typescript`, `sql`, `python`, `go`, `rust`, `java`, `css`, `html`, `other`

Add: `c`, `cpp`, `cs`, `php`, `json`, `markdown`, `yaml`, `shell`, `ruby`, `kotlin`, `swift`

### New enum: `roast_status`

Values: `'pending'`, `'completed'`, `'failed'`

### Modified table: `roasts`

| Change | Details |
|---|---|
| Add column `status` | `roast_status` enum, `notNull()`, default `'pending'` |
| Add column `ip` | `text`, nullable. Stores the client IP for rate limiting |
| Make `score` nullable | Was `real notNull()`, becomes `real` (nullable) |
| Make `verdict` nullable | Was `verdict enum notNull()`, becomes nullable |
| Make `roast_quote` nullable | Was `text notNull()`, becomes nullable |

The `code`, `language`, `lineCount`, and `roastMode` columns remain `notNull` — they are set at creation time. The result columns (`score`, `verdict`, `roastQuote`, `suggestedDiff`, `diffFileName`) are null while the roast is `pending` and populated when the stream completes.

### No changes to `roast_issues`

Issues are inserted in a batch after the stream completes, same as before.

## Server Action: `createRoast`

**File:** `src/app/actions.ts` (must have `'use server'` directive at top)

**Input validation (Zod):**
- `code`: string, min 1, max 5000
- `language`: one of the `languageEnum` values (default: `'other'` if omitted)
- `roastMode`: boolean

**IP extraction:**

In Next.js 16, `headers()` from `next/headers` is async — it returns `Promise<Headers>` and must be awaited:

```typescript
import { headers } from 'next/headers'

const headersList = await headers()
const forwardedFor = headersList.get('x-forwarded-for')
const ip = forwardedFor?.split(',')[0]?.trim()
  ?? headersList.get('x-real-ip')
  ?? 'unknown'
```

**Rate limiting:**
```sql
SELECT COUNT(*) FROM roasts
WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 hour' AND status != 'failed'
```
If count >= 5, return `{ error: 'rate limit exceeded. try again later.' }`.

**On success:**
1. Calculate `lineCount` from `code.split('\n').length`
2. Insert into `roasts` with `status: 'pending'`, `code`, `language`, `lineCount`, `roastMode`, `ip`
3. Return `{ id }`

**On error:**
- Validation failure: return `{ error: 'invalid input' }` with details
- Rate limit: return `{ error: 'rate limit exceeded. try again later.' }`
- DB error: return `{ error: 'something went wrong' }`

## API Route: Streaming

**File:** `src/app/api/roast/[id]/stream/route.ts`

**Method:** `POST` (required by `useObject` — its `submit()` sends a POST request)

**Flow:**
1. Look up roast by `id` in DB
2. If not found: return 404
3. If `status !== 'pending'`: return 409 (already processed)
4. Call `streamObject` from `ai` package with:
   - Model: `google('gemini-2.0-flash')` from `@ai-sdk/google`
   - System prompt (see Prompt section)
   - User prompt with the code
   - Zod schema for structured output
   - Temperature based on `roastMode`
5. Return the stream as response via `result.toTextStreamResponse()`
6. In `onFinish` callback:
   - Use `WHERE id = $1 AND status = 'pending'` to prevent duplicate writes if user reloads during stream
   - Update roast record: set `score`, `verdict`, `roastQuote`, `suggestedDiff`, `diffFileName`, `status: 'completed'`
   - Insert `roast_issues` rows with `position` matching array index
7. On error: update roast `status` to `'failed'`

**Timeout:** Set `export const maxDuration = 60` on the API Route to allow up to 60 seconds for the AI stream.

### Structured output schema (Zod)

```typescript
const roastResultSchema = z.object({
  score: z.number().min(0).max(10).describe('Code quality score from 0.0 (terrible) to 10.0 (perfect)'),
  verdict: z.enum(['needs_serious_help', 'bad', 'mediocre', 'decent', 'clean_code']),
  roastQuote: z.string().describe('A short, memorable phrase summarizing the review (max ~150 chars)'),
  issues: z.array(z.object({
    severity: z.enum(['critical', 'warning', 'good']),
    title: z.string(),
    description: z.string(),
  })).describe('List of issues found, from most severe to least. Include positive points with severity "good" if applicable'),
  suggestedDiff: z.string().optional().describe('Unified diff showing the most important fix, if relevant'),
  diffFileName: z.string().optional().describe('Suggested filename for the diff'),
})
```

This schema is shared between the API Route (for `streamObject`) and the client (for `useObject`). Place in `src/lib/roast-schema.ts`.

## AI Prompt

### System prompt (base)

```
You are a brutally honest code reviewer. Analyze the provided code and return a structured evaluation.

Rules:
- score: 0.0 to 10.0 where 0 is terrible code and 10 is perfect
- verdict: based on score (0-2: needs_serious_help, 2-4: bad, 4-6: mediocre, 6-8: decent, 8-10: clean_code)
- roastQuote: a short, memorable phrase summarizing the evaluation (max ~150 chars)
- issues: list problems found, from most severe to least. Include positive points with severity "good" if any exist
- suggestedDiff: if relevant, provide a unified diff showing the most important correction. Omit if not applicable.
- diffFileName: suggested filename for the diff

Always respond in English.
```

### Roast mode addition

When `roastMode: true`, append to system prompt:

```
ROAST MODE ACTIVATED: Be maximum sarcastic and funny.
The roastQuote should be a memorable joke/burn about the code.
Issue descriptions should have acid humor.
Keep the technical analysis accurate, but with a stand-up comedy tone roasting the code.
```

### User prompt

```
Language: {language}

Code:
```{language}
{code}
```
```

### Temperature

- `roastMode: true`: `0.8`
- `roastMode: false`: `0.3`

## Client Components

### CodeInputSection changes

**File:** `src/app/code-input-section.tsx`

Add:
- `isPending` state via `useTransition`
- `error` state for displaying validation/rate-limit errors
- `onClick` handler on the button:
  1. Call `createRoast({ code, language: language ?? 'other', roastMode })` via the Server Action (defaults `language` to `'other'` if undefined)
  2. If success, `router.push('/roast/${result.id}')`
  3. If error, set `error` state, display below the button
- While `isPending`, button shows loading state (disabled + text change to `$ roasting...`)

### RoastStreamView

**File:** `src/app/roast/[id]/roast-stream-view.tsx`

Client component (`'use client'`). Receives `roastId` and `roastMode` as props.

Uses `experimental_useObject as useObject` from `@ai-sdk/react`:
```typescript
import { experimental_useObject as useObject } from '@ai-sdk/react'

const { object, isLoading, error, submit } = useObject({
  api: `/api/roast/${roastId}/stream`,
  schema: roastResultSchema,
})

// Trigger the stream on mount
useEffect(() => {
  submit(undefined)
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

**Important:** `useObject` does **not** auto-fetch. The `submit()` function must be called explicitly (here via `useEffect` on mount) to initiate the streaming connection.

Renders progressively as partial `object` arrives:
- `ScoreRing`: renders with `object.score ?? 0`, animates as the real score arrives
- `Badge`: appears when `object.verdict` is defined
- `roastQuote`: renders `object.roastQuote` as it streams in (text grows character by character naturally from partial objects)
- Issues: renders `object.issues?.map(...)` — cards appear one by one as the array grows
- Diff: renders when `object.suggestedDiff` is defined

When `isLoading` becomes false and no error, calls `router.refresh()` to revalidate server data.

If `error`, displays an error state.

### RoastErrorView

**File:** `src/app/roast/[id]/roast-error-view.tsx`

Simple component shown when `status === 'failed'`. Displays:
- Error message: `// something went wrong while roasting your code`
- Button to go back to homepage: `$ try_again`

### Page routing logic

**File:** `src/app/roast/[id]/page.tsx`

The existing `RoastResultContent` async component adds a status check:

```
status === 'completed' -> render existing result UI (server-side, no changes)
status === 'pending'   -> render <RoastStreamView roastId={id} roastMode={roast.roastMode} />
status === 'failed'    -> render <RoastErrorView />
```

**Nullable type handling:** After the `status === 'completed'` check, the result fields (`score`, `verdict`, `roastQuote`) are guaranteed non-null. Use type narrowing (e.g., a guard function or assertion) so the existing `RoastResultContent` TypeScript types don't break:

```typescript
if (roast.status === 'completed') {
  // At this point, score/verdict/roastQuote are guaranteed non-null
  // Use a type guard or non-null assertion for the existing UI
}
```

The outer page structure (Suspense wrapper, skeleton) stays the same.

## Rate Limiting

Simple DB-based approach, no external dependencies.

- **Limit:** 5 roasts per IP per hour
- **Enforcement point:** Server Action (`createRoast`), before inserting the record
- **IP source:** `x-forwarded-for` header (first IP) or `x-real-ip`, fallback `'unknown'`
- **Query:** count roasts with matching IP created in the last hour
- **Stored in:** `roasts.ip` column (nullable text)

## New Dependencies

| Package | Purpose |
|---|---|
| `ai@^5` | Vercel AI SDK core — `streamObject` |
| `@ai-sdk/react@^5` | AI SDK React hooks — `experimental_useObject` |
| `@ai-sdk/google` | Google Gemini provider for AI SDK |

**Zod v4 compatibility:** The project uses `zod@^4.3.6`. AI SDK v5 has internal support for Zod v4 — no compat layer is needed. Import `z` from `zod` as usual.

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key. Required for roast generation. |

Add to `.env.example` and `.env.local`.

## File Changes Summary

| File | Change |
|---|---|
| `src/db/schema.ts` | Extend `languageEnum`, add `roastStatus` enum, `status` and `ip` columns, make result fields nullable |
| `src/trpc/routers/roast.ts` | Update `getById` to include `status` field; TypeScript types will change due to nullable result fields |
| `src/lib/roast-schema.ts` | New — shared Zod schema for AI structured output |
| `src/app/actions.ts` | New — `createRoast` Server Action |
| `src/app/api/roast/[id]/stream/route.ts` | New — streaming API Route |
| `src/app/code-input-section.tsx` | Add submit handler, loading state, error display |
| `src/app/roast/[id]/page.tsx` | Add status-based routing (completed/pending/failed) |
| `src/app/roast/[id]/roast-stream-view.tsx` | New — client component consuming the AI stream |
| `src/app/roast/[id]/roast-error-view.tsx` | New — error state component |
| `.env.example` | Add `GOOGLE_GENERATIVE_AI_API_KEY` |
| `.env.local` | Add `GOOGLE_GENERATIVE_AI_API_KEY` |
| DB migration | New migration for schema changes |

## Error Handling Summary

| Scenario | Behavior |
|---|---|
| Empty code / over limit | Button disabled (existing behavior) |
| Validation failure in Server Action | Error message shown below button on homepage |
| Rate limit exceeded | Error message: "rate limit exceeded. try again later." |
| DB error on create | Error message: "something went wrong" |
| AI stream fails mid-stream | Roast marked `failed`, error view shown |
| User reloads pending roast | If stream still running: POST returns 409. `RoastStreamView` catches 409, waits 2s, then calls `router.refresh()` to pick up the completed result. If already completed: loads from DB. If failed: shows error view |
| User visits failed roast | Error view with "try again" button |
| API Route called for completed roast | Returns 409, client can fall back to DB data |
| Race condition on DB write | `onFinish` uses `WHERE status = 'pending'` to prevent duplicate writes |
| AI stream hangs | `maxDuration = 60` on API Route kills the request after 60s |
