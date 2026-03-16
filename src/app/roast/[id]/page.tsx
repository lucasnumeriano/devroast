import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { BundledLanguage } from 'shiki'
import { CodeExpandButton } from '@/app/code-expand-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { db } from '@/db'
import { roasts } from '@/db/schema'
import { caller } from '@/trpc/server'
import { RoastErrorView } from './roast-error-view'
import { RoastStreamView } from './roast-stream-view'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  let roast:
    | {
        score: number | null
        verdict: string | null
        roastQuote: string | null
        status: string
      }
    | undefined

  try {
    const [result] = await db
      .select({
        score: roasts.score,
        verdict: roasts.verdict,
        roastQuote: roasts.roastQuote,
        status: roasts.status,
      })
      .from(roasts)
      .where(eq(roasts.id, id))
      .limit(1)
    roast = result
  } catch {
    // Invalid UUID — fall through to not-found metadata
  }

  if (!roast) {
    return { title: 'roast not found | devroast' }
  }

  if (roast.status !== 'completed') {
    return {
      title: 'roast in progress | devroast',
      description: 'a code roast is being prepared...',
    }
  }

  const verdictLabel = roast.verdict?.replace(/_/g, ' ') ?? 'mediocre'

  return {
    title: `score: ${roast.score?.toFixed(1)}/10 — ${verdictLabel} | devroast`,
    description: roast.roastQuote ?? 'your code has been roasted.',
  }
}

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

function RoastResultSkeleton() {
  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      <div className="flex w-full items-center gap-12">
        <div className="size-24 animate-pulse rounded-full bg-zinc-800" />
        <div className="flex flex-1 flex-col gap-4">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="h-6 w-96 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </main>
  )
}

async function RoastResultContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roast = await caller.roast.getById({ id })

  if (!roast) notFound()

  // Pending: show streaming view
  if (roast.status === 'pending') {
    return <RoastStreamView roastId={id} roastMode={roast.roastMode} />
  }

  // Failed: show error view
  if (roast.status === 'failed') {
    return <RoastErrorView />
  }

  // Completed: fallback values safe since only completed roasts reach here
  const score = roast.score ?? 0
  const verdict = roast.verdict ?? 'mediocre'
  const roastQuote = roast.roastQuote ?? ''

  const badgeStatus = verdictToBadgeStatus[verdict] ?? 'warning'

  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* Score Hero */}
      <section className="flex w-full items-center gap-12">
        <ScoreRing score={score} />

        <div className="flex flex-1 flex-col gap-4">
          <Badge status={badgeStatus}>verdict: {verdictLabels[verdict] ?? verdict}</Badge>

          <p className="font-sans text-xl leading-relaxed text-zinc-50">{roastQuote}</p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-zinc-600">lang: {roast.language}</span>
            <span className="font-mono text-xs text-zinc-600">&middot;</span>
            <span className="font-mono text-xs text-zinc-600">{roast.lineCount} lines</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              $ share_roast
            </Button>
          </div>
        </div>
      </section>

      <Divider />

      {/* Submitted Code */}
      <section className="flex flex-col gap-4">
        <SectionTitle>your_submission</SectionTitle>

        <div>
          <div className="overflow-hidden border border-zinc-800">
            <div className="relative">
              <CodeBlock
                code={roast.code}
                lang={roast.language as BundledLanguage}
                className="h-65 bg-[#111111]"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-[#111111] to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
          <CodeExpandButton roastId={id} language={roast.language} lineCount={roast.lineCount} />
        </div>
      </section>

      <Divider />

      {/* Analysis */}
      <section className="flex flex-col gap-6">
        <SectionTitle>detailed_analysis</SectionTitle>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            {roast.issues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <Badge status={issue.severity}>{issue.severity}</Badge>
                </CardHeader>
                <CardTitle>{issue.title}</CardTitle>
                <CardDescription>{issue.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Suggested Fix (only shown when diff exists) */}
      {roast.suggestedDiff && (
        <>
          <Divider />

          <section className="flex flex-col gap-6">
            <SectionTitle>suggested_fix</SectionTitle>

            <div className="overflow-hidden border border-zinc-800 bg-zinc-950">
              {roast.diffFileName && (
                <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
                  <span className="font-mono text-xs font-medium text-zinc-500">
                    {roast.diffFileName}
                  </span>
                </div>
              )}

              <div className="flex flex-col py-1">
                {parseDiff(roast.suggestedDiff).map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are static, never reordered
                  <DiffLine key={i} type={line.type}>
                    {line.content}
                  </DiffLine>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default function RoastResultPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<RoastResultSkeleton />}>
      <RoastResultContent params={params} />
    </Suspense>
  )
}
