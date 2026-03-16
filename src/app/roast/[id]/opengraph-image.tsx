import { ImageResponse } from '@takumi-rs/image-response'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { roasts } from '@/db/schema'

export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

// TTF URLs — Satori (used by both next/og and Takumi) only supports woff/ttf/otf, NOT woff2
const FONT_URLS = {
  jetbrainsMonoRegular:
    'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf',
  jetbrainsMonoBold:
    'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf',
  ibmPlexMono: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n5ig.ttf',
}

const COLORS = {
  bgPage: '#0A0A0A',
  textPrimary: '#FAFAFA',
  textTertiary: '#4B5563',
  accentGreen: '#10B981',
  accentAmber: '#F59E0B',
  accentRed: '#EF4444',
}

function getScoreColor(score: number): string {
  if (score < 4) return COLORS.accentRed
  if (score < 7) return COLORS.accentAmber
  return COLORS.accentGreen
}

function truncateQuote(quote: string, maxLength = 120): string {
  if (quote.length <= maxLength) return quote
  return `${quote.slice(0, maxLength).trimEnd()}…`
}

type FontData = {
  name: string
  data: ArrayBuffer
  weight: number
  style: 'normal'
}

let fontsCache: FontData[] | null = null

async function loadFonts(): Promise<FontData[]> {
  if (fontsCache) return fontsCache

  const [jetbrainsRegularData, jetbrainsBoldData, ibmPlexData] = await Promise.all([
    fetch(FONT_URLS.jetbrainsMonoRegular).then((r) => r.arrayBuffer()),
    fetch(FONT_URLS.jetbrainsMonoBold).then((r) => r.arrayBuffer()),
    fetch(FONT_URLS.ibmPlexMono).then((r) => r.arrayBuffer()),
  ])

  fontsCache = [
    { name: 'JetBrains Mono', data: jetbrainsRegularData, weight: 400, style: 'normal' },
    { name: 'JetBrains Mono', data: jetbrainsBoldData, weight: 700, style: 'normal' },
    { name: 'IBM Plex Mono', data: ibmPlexData, weight: 400, style: 'normal' },
  ]

  return fontsCache
}

function FallbackImage({ message }: { message: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bgPage,
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.accentGreen,
          }}
        >
          {'>'}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          devroast
        </span>
      </div>
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 22,
          color: COLORS.textTertiary,
        }}
      >
        {message}
      </span>
    </div>
  )
}

function RoastImage({
  score,
  verdict,
  language,
  lineCount,
  roastQuote,
}: {
  score: number
  verdict: string
  language: string
  lineCount: number
  roastQuote: string
}) {
  const scoreColor = getScoreColor(score)
  const truncatedQuote = truncateQuote(roastQuote)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bgPage,
        padding: 64,
        gap: 28,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.accentGreen,
          }}
        >
          {'>'}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          devroast
        </span>
      </div>

      {/* Score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 160,
            fontWeight: 700,
            color: scoreColor,
            lineHeight: 1,
          }}
        >
          {score.toFixed(1)}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 56,
            color: COLORS.textTertiary,
          }}
        >
          /10
        </span>
      </div>

      {/* Verdict */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: scoreColor,
          }}
        />
        <span
          style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            color: COLORS.textPrimary,
          }}
        >
          {verdict}
        </span>
      </div>

      {/* Meta line */}
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 16,
          color: COLORS.textTertiary,
        }}
      >
        {`lang: ${language} · ${lineCount} lines`}
      </span>

      {/* Roast quote */}
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: 22,
          color: COLORS.textPrimary,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        {`"${truncatedQuote}"`}
      </span>
    </div>
  )
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const fonts = await loadFonts()

  let roast:
    | {
        score: number | null
        verdict: string | null
        roastQuote: string | null
        language: string
        lineCount: number
        status: string
      }
    | undefined

  try {
    const [result] = await db
      .select({
        score: roasts.score,
        verdict: roasts.verdict,
        roastQuote: roasts.roastQuote,
        language: roasts.language,
        lineCount: roasts.lineCount,
        status: roasts.status,
      })
      .from(roasts)
      .where(eq(roasts.id, id))
      .limit(1)
    roast = result
  } catch {
    // Invalid UUID or DB error — treat as not found
  }

  if (!roast) {
    return new Response(null, { status: 404 })
  }

  if (roast.status === 'pending') {
    return new ImageResponse(<FallbackImage message="roasting in progress..." />, {
      ...size,
      fonts,
      headers: { 'Cache-Control': 'no-cache' },
    })
  }

  if (roast.status === 'failed') {
    return new ImageResponse(<FallbackImage message="roast failed" />, {
      ...size,
      fonts,
      headers: { 'Cache-Control': 'no-cache' },
    })
  }

  return new ImageResponse(
    <RoastImage
      score={roast.score ?? 0}
      verdict={(roast.verdict ?? 'mediocre').replace(/_/g, ' ')}
      language={roast.language}
      lineCount={roast.lineCount}
      roastQuote={roast.roastQuote ?? ''}
    />,
    {
      ...size,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  )
}
