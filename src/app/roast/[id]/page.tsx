import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'

const roastData = {
  score: 3.5,
  verdict: 'needs_serious_help' as const,
  roastLine: '"this code looks like it was written during a power outage... in 2005."',
  language: 'javascript',
  lineCount: 7,
  code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    discount = calculateDiscount(total);
    total = total - 0.1;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`,
  issues: [
    {
      status: 'critical' as const,
      title: 'using var instead of const/let',
      description:
        'var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.',
    },
    {
      status: 'warning' as const,
      title: 'imperative loop pattern',
      description:
        'for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.',
    },
    {
      status: 'good' as const,
      title: 'clear naming conventions',
      description:
        'calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.',
    },
    {
      status: 'good' as const,
      title: 'single responsibility',
      description:
        'the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.',
    },
  ],
  diff: {
    filename: 'your_code.ts → improved_code.ts',
    lines: [
      { type: 'context' as const, content: 'function calculateTotal(items) {' },
      { type: 'removed' as const, content: '  var total = 0;' },
      { type: 'removed' as const, content: '  for (var i = 0; i < items.length; i++) {' },
      { type: 'removed' as const, content: '    total = total + items[i].price;' },
      { type: 'removed' as const, content: '  }' },
      { type: 'removed' as const, content: '  return total;' },
      {
        type: 'added' as const,
        content: '  return items.reduce((sum, item) => sum + item.price, 0);',
      },
      { type: 'context' as const, content: '}' },
    ],
  },
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
  // TODO: fetch roast data by id when API is ready
  const { id: _id } = await params

  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* Score Hero */}
      <section className="flex w-full items-center gap-12">
        <ScoreRing score={roastData.score} />

        <div className="flex flex-1 flex-col gap-4">
          <Badge status="critical">verdict: {roastData.verdict}</Badge>

          <p className="font-sans text-xl leading-relaxed text-zinc-50">{roastData.roastLine}</p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-zinc-600">lang: {roastData.language}</span>
            <span className="font-mono text-xs text-zinc-600">·</span>
            <span className="font-mono text-xs text-zinc-600">{roastData.lineCount} lines</span>
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
          <CodeBlock code={roastData.code} lang="javascript" />
        </div>
      </section>

      <Divider />

      {/* Analysis */}
      <section className="flex flex-col gap-6">
        <SectionTitle>detailed_analysis</SectionTitle>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            {roastData.issues.map((issue) => (
              <Card key={issue.title}>
                <CardHeader>
                  <Badge status={issue.status}>{issue.status}</Badge>
                </CardHeader>
                <CardTitle>{issue.title}</CardTitle>
                <CardDescription>{issue.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Suggested Fix */}
      <section className="flex flex-col gap-6">
        <SectionTitle>suggested_fix</SectionTitle>

        <div className="overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
            <span className="font-mono text-xs font-medium text-zinc-500">
              {roastData.diff.filename}
            </span>
          </div>

          <div className="flex flex-col py-1">
            {roastData.diff.lines.map((line) => (
              <DiffLine key={`${line.type}-${line.content}`} type={line.type}>
                {line.content}
              </DiffLine>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
