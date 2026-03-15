import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { BundledLanguage } from 'shiki'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { caller } from '@/trpc/server'

export const metadata: Metadata = {
  title: 'roast result | devroast',
  description: 'your code has been roasted. see how it scored.',
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

export default async function RoastResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roast = await caller.roast.getById({ id })

  if (!roast) notFound()

  const badgeStatus = verdictToBadgeStatus[roast.verdict] ?? 'warning'

  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* Score Hero */}
      <section className="flex w-full items-center gap-12">
        <ScoreRing score={roast.score} />

        <div className="flex flex-1 flex-col gap-4">
          <Badge status={badgeStatus}>
            verdict: {verdictLabels[roast.verdict] ?? roast.verdict}
          </Badge>

          <p className="font-sans text-xl leading-relaxed text-zinc-50">{roast.roastQuote}</p>

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

        <div className="overflow-hidden border border-zinc-800">
          <CodeBlock code={roast.code} lang={roast.language as BundledLanguage} />
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
                {parseDiff(roast.suggestedDiff).map((line) => (
                  <DiffLine key={`${line.type}-${line.content}`} type={line.type}>
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
