'use client'

import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { roastResultSchema } from '@/lib/roast-schema'

const verdictLabels: Record<string, string> = {
  needs_serious_help: 'needs serious help',
  bad: 'bad',
  mediocre: 'mediocre',
  decent: 'decent',
  clean_code: 'clean code',
}

const verdictToBadgeStatus: Record<string, 'critical' | 'warning' | 'good'> = {
  needs_serious_help: 'critical',
  bad: 'critical',
  mediocre: 'warning',
  decent: 'good',
  clean_code: 'good',
}

function parseDiff(
  suggestedDiff: string,
): { type: 'added' | 'removed' | 'context'; content: string }[] {
  return suggestedDiff.split('\n').map((line) => {
    if (line.startsWith('+')) {
      return { type: 'added' as const, content: line.slice(1) }
    }
    if (line.startsWith('-')) {
      return { type: 'removed' as const, content: line.slice(1) }
    }
    return { type: 'context' as const, content: line.startsWith(' ') ? line.slice(1) : line }
  })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold text-emerald-500">{'//'}</span>
      <span className="font-mono text-sm font-bold text-zinc-50">{children}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-px w-full bg-zinc-800" />
}

type RoastStreamViewProps = {
  roastId: string
  roastMode: boolean
}

function RoastStreamView({ roastId, roastMode }: RoastStreamViewProps) {
  const router = useRouter()

  const { object, isLoading, error, submit } = useObject({
    api: `/api/roast/${roastId}/stream`,
    schema: roastResultSchema,
    fetch: async (input, init) => {
      const response = await fetch(input, init)

      // Handle non-200 responses before useObject tries to parse the stream
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))

        if (response.status === 429 || body.error === 'rate_limit') {
          const retrySeconds = body.retry ?? 60
          router.replace(`/?error=rate_limit&retry=${retrySeconds}`)
          // Return an empty response so useObject doesn't throw a parse error
          return new Response('', { status: 200 })
        }

        if (response.status === 409) {
          setTimeout(() => router.refresh(), 2000)
          return new Response('', { status: 200 })
        }

        throw new Error(body.error ?? 'something went wrong')
      }

      return response
    },
    onError(err: Error) {
      console.error('useObject error:', err)
    },
  })

  // Trigger the stream on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    submit(undefined)
  }, [])

  // When streaming finishes successfully, refresh to load server data
  useEffect(() => {
    if (!isLoading && !error && object) {
      router.refresh()
    }
  }, [isLoading, error, object, router])

  // Error state
  if (error) {
    return (
      <main className="flex flex-col items-center justify-center gap-6 px-20 py-20">
        <p className="font-mono text-sm text-zinc-500">
          {'// something went wrong while roasting your code'}
        </p>
        <a href="/" className="font-mono text-xs text-emerald-500 hover:text-emerald-400">
          $ try_again
        </a>
      </main>
    )
  }

  // No data from the stream yet — show a loading skeleton
  const hasData = object && (object.score !== undefined || object.verdict || object.roastQuote)

  if (isLoading && !hasData) {
    return (
      <main className="flex flex-col gap-10 px-20 py-10">
        <section className="flex w-full items-center gap-12">
          <div className="size-24 animate-pulse rounded-full bg-zinc-800" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-5 w-36 animate-pulse rounded bg-zinc-800" />
            <div className="h-6 w-96 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
          </div>
        </section>

        <Divider />

        <div className="flex items-center gap-2">
          <span className="animate-pulse font-mono text-sm text-emerald-500/70">{'>'}</span>
          <span className="animate-pulse font-mono text-sm text-zinc-500">
            {roastMode ? '// roasting in progress...' : '// analyzing code...'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="h-28 animate-pulse rounded border border-zinc-800 bg-zinc-900/50" />
          <div className="h-28 animate-pulse rounded border border-zinc-800 bg-zinc-900/50" />
        </div>
      </main>
    )
  }

  const score = object?.score ?? 0
  const verdict = object?.verdict
  const badgeStatus = verdict ? (verdictToBadgeStatus[verdict] ?? 'warning') : undefined

  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* Score Hero */}
      <section className="flex min-h-45 w-full items-center gap-12">
        <ScoreRing score={score} />

        <div className="flex flex-1 flex-col gap-4">
          {verdict && badgeStatus && (
            <Badge status={badgeStatus}>verdict: {verdictLabels[verdict] ?? verdict}</Badge>
          )}

          {object?.roastQuote && (
            <p className="font-sans text-xl leading-relaxed text-zinc-50">{object.roastQuote}</p>
          )}

          {isLoading && !object?.roastQuote && (
            <div className="h-6 w-96 animate-pulse rounded bg-zinc-800" />
          )}
        </div>
      </section>

      {/* Issues */}
      {object?.issues && object.issues.length > 0 && (
        <div className="animate-fade-in flex flex-col gap-10">
          <Divider />

          <section className="flex flex-col gap-6">
            <SectionTitle>detailed_analysis</SectionTitle>

            <div className="grid grid-cols-2 gap-5">
              {object.issues.map((issue, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: issues stream in order, never reordered
                <Card key={i} className="min-h-28 animate-fade-in">
                  <CardHeader>
                    {issue?.severity && <Badge status={issue.severity}>{issue.severity}</Badge>}
                  </CardHeader>
                  {issue?.title && <CardTitle>{issue.title}</CardTitle>}
                  {issue?.description && <CardDescription>{issue.description}</CardDescription>}
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Suggested Diff */}
      {object?.suggestedDiff && (
        <div className="animate-fade-in flex flex-col gap-10">
          <Divider />

          <section className="flex flex-col gap-6">
            <SectionTitle>suggested_fix</SectionTitle>

            <div className="min-h-20 overflow-hidden border border-zinc-800 bg-zinc-950">
              {object.diffFileName && (
                <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
                  <span className="font-mono text-xs font-medium text-zinc-500">
                    {object.diffFileName}
                  </span>
                </div>
              )}

              <div className="flex flex-col py-1">
                {parseDiff(object.suggestedDiff).map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are append-only, never reordered
                  <DiffLine key={i} type={line.type}>
                    {line.content}
                  </DiffLine>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2">
          <span className="animate-pulse font-mono text-xs text-zinc-600">
            {roastMode ? '// roasting in progress...' : '// analyzing code...'}
          </span>
        </div>
      )}
    </main>
  )
}

export { RoastStreamView, type RoastStreamViewProps }
