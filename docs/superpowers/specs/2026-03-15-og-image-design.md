# OG Image Generation for Roast Results

## Summary

Add dynamically generated Open Graph images to shareable roast result links (`/roast/[id]`). When a roast URL is shared on social media or messaging apps, the embed displays a branded image showing the roast score, verdict, language, and a truncated roast quote. Images are generated on-demand using Takumi (`@takumi-rs/image-response`).

## Approach

**Next.js Convention Route** (`opengraph-image.tsx`). A file at `src/app/roast/[id]/opengraph-image.tsx` is auto-discovered by Next.js App Router, which injects the `<meta property="og:image">` tag without manual wiring. This is the most idiomatic approach with the least boilerplate.

### Alternatives Considered

- **API Route (`/api/og/[id]`):** More boilerplate (manual `generateMetadata` URL wiring, full URL construction). No clear benefit over the convention file.
- **Static generation at roast completion:** Pre-generates images and stores them. Adds storage complexity and makes design iteration harder. Overkill given low crawler traffic.

## File Changes

### New Files

**`src/app/roast/[id]/opengraph-image.tsx`** — OG image generation route.

### Modified Files

- **`src/app/roast/[id]/page.tsx`** — Convert static `metadata` export to `generateMetadata()` for dynamic title/description per roast.
- **`next.config.ts`** — Add `serverExternalPackages: ["@takumi-rs/core"]`.
- **`package.json`** — Add `@takumi-rs/image-response` dependency.

## Image Layout

1200x630px, single centered column, dark background.

```
┌─────────────────────────────────────────────────┐
│                     64px padding                │
│              > devroast                         │
│                  28px gap                       │
│               3.5 /10                           │
│             ● needs_serious_help                │
│          lang: javascript · 7 lines             │
│                  28px gap                       │
│    "Your code looks like it was written         │
│     during a power outage with boxing..."       │
│                     64px padding                │
└─────────────────────────────────────────────────┘
```

### Element Specifications

| Element | Font | Size | Color | Notes |
|---|---|---|---|---|
| `>` prompt | JetBrains Mono | 24px | `#10B981` (accent-green) | Bold |
| `devroast` text | JetBrains Mono | 24px | `#FAFAFA` (text-primary) | Bold |
| Score number | JetBrains Mono | 160px | Score-tier color | Bold |
| `/10` suffix | JetBrains Mono | 56px | `#4B5563` (text-tertiary) | Regular, baseline-aligned with score |
| Verdict dot | — | 12px | Score-tier color | Filled circle |
| Verdict text | JetBrains Mono | 24px | `#FAFAFA` (text-primary) | Underscore-separated enum value |
| Meta line | IBM Plex Mono | 16px | `#4B5563` (text-tertiary) | Format: `lang: {language} · {lineCount} lines` |
| Roast quote | IBM Plex Mono | 22px | `#FAFAFA` (text-primary) | 1.5 line-height, centered, wrapped in quotes |

### Score Color Tiers

| Range | Color | Token |
|---|---|---|
| 0–3.9 | `#EF4444` | accent-red |
| 4–6.9 | `#F59E0B` | accent-amber |
| 7–10 | `#10B981` | accent-green |

## Data Access

The OG image route queries the `roasts` table directly via Drizzle, selecting only the fields needed for rendering:

- `score` (real, nullable)
- `verdict` (enum, nullable)
- `roastQuote` (text, nullable)
- `language` (enum)
- `lineCount` (integer)
- `status` (enum: pending/completed/failed)

This avoids importing the tRPC caller — the route is server-side only and needs a lightweight, focused query. The database connection is imported from the existing `@/db` module.

## Caching

**Completed roasts:** `Cache-Control: public, max-age=31536000, immutable`. Roasts are immutable once completed — the image never changes.

**Pending/failed roasts:** `Cache-Control: no-cache`. Allows re-crawls to pick up the completed image when the roast finishes.

## Edge Cases

### Pending Roasts

Return a branded fallback image (same 1200x630 dark background):
- `> devroast` logo centered
- `"roasting in progress..."` in `#4B5563` (text-tertiary)

### Failed Roasts

Same branded fallback:
- `> devroast` logo centered
- `"roast failed"` in `#4B5563` (text-tertiary)

### Roast Not Found

Return a 404 response (no image). The page itself already calls `notFound()` for missing UUIDs.

### Quote Truncation

Roast quotes longer than ~120 characters are truncated with an ellipsis (`…`). This keeps the image clean and readable at social media embed sizes.

## Font Loading

Fonts are loaded at runtime via `fetch()` from Google Fonts CDN (same URLs used in `globals.css`), converted to `ArrayBuffer`, and passed to Takumi's `ImageResponse` options:

- **JetBrains Mono** (variable weight, woff2): `https://fonts.gstatic.com/s/jetbrainsmono/v21/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2`
- **IBM Plex Mono** (400 weight, woff2): `https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n5iQ.woff2`

Takumi supports woff2 and custom font registration in the `ImageResponse` constructor options.

## Dynamic Metadata

The static `metadata` export in `page.tsx` is replaced with `generateMetadata()`:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  const roast = await db.select(...).from(roasts).where(eq(roasts.id, id)).limit(1)

  if (!roast) {
    return { title: 'roast not found | devroast' }
  }

  if (roast.status !== 'completed') {
    return {
      title: 'roast in progress | devroast',
      description: 'a code roast is being prepared...',
    }
  }

  return {
    title: `score: ${roast.score}/10 — ${roast.verdict} | devroast`,
    description: roast.roastQuote ?? 'your code has been roasted.',
  }
}
```

The `og:image` meta tag is handled automatically by the `opengraph-image.tsx` convention file — no manual URL wiring needed.

## Output Format

PNG. Best compatibility across social platforms (Twitter/X, Discord, Slack, iMessage, LinkedIn, Facebook). Target size: under 200KB per image.

## Dependencies

| Package | Purpose |
|---|---|
| `@takumi-rs/image-response` | JSX-to-image rendering (Rust-powered, drop-in replacement for `next/og`) |

### Config Changes

```ts
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config
  serverExternalPackages: ["@takumi-rs/core"],
}
```
