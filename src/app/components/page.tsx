import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { ToggleDemo } from './toggle-demo'

const buttonVariants = ['primary', 'danger', 'secondary', 'ghost'] as const
const buttonSizes = ['sm', 'md', 'lg'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-sm text-zinc-400 uppercase tracking-wider">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-zinc-500">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const sampleCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
}`

export default async function ComponentsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="space-y-2">
          <h1 className="font-mono text-2xl font-bold text-emerald-500">$ ui_components</h1>
          <p className="font-mono text-sm text-zinc-400">
            Visual reference for all UI components and their variants.
          </p>
        </header>

        {/* Button */}
        <Section title="button">
          <Row label="variants x sizes">
            {buttonVariants.map((variant) =>
              buttonSizes.map((size) => (
                <Button key={`${variant}-${size}`} variant={variant} size={size}>
                  {variant}/{size}
                </Button>
              )),
            )}
          </Row>

          <Row label="disabled state">
            {buttonVariants.map((variant) => (
              <Button key={variant} variant={variant} disabled>
                {variant}
              </Button>
            ))}
          </Row>
        </Section>

        {/* Badge */}
        <Section title="badge_status">
          <Row label="variants">
            <Badge status="critical">critical</Badge>
            <Badge status="warning">warning</Badge>
            <Badge status="good">good</Badge>
          </Row>
        </Section>

        {/* Toggle */}
        <Section title="toggle">
          <ToggleDemo />
        </Section>

        {/* Card */}
        <Section title="cards">
          <div className="max-w-lg">
            <Card>
              <CardHeader>
                <Badge status="critical">critical</Badge>
              </CardHeader>
              <CardTitle>using var instead of const/let</CardTitle>
              <CardDescription>
                the var keyword is function-scoped rather than block-scoped, which can lead to
                unexpected behavior and bugs. modern javascript uses const for immutable bindings
                and let for mutable ones.
              </CardDescription>
            </Card>
          </div>

          <div className="max-w-lg">
            <Card>
              <CardHeader>
                <Badge status="warning">warning</Badge>
              </CardHeader>
              <CardTitle>missing error handling in async function</CardTitle>
              <CardDescription>
                async functions should always include proper error handling with try/catch blocks to
                prevent unhandled promise rejections.
              </CardDescription>
            </Card>
          </div>
        </Section>

        {/* CodeBlock */}
        <Section title="code_block">
          <div className="max-w-xl">
            <CodeBlock code={sampleCode} lang="javascript" filename="calculate.js" />
          </div>
        </Section>

        {/* DiffLine */}
        <Section title="diff_line">
          <div className="max-w-xl">
            <DiffLine type="removed">var total = 0;</DiffLine>
            <DiffLine type="added">const total = 0;</DiffLine>
            <DiffLine type="context">{'for (let i = 0; i < items.length; i++) {'}</DiffLine>
          </div>
        </Section>

        {/* ScoreRing */}
        <Section title="score_ring">
          <Row label="different scores">
            <ScoreRing score={3.5} />
            <ScoreRing score={7.2} />
            <ScoreRing score={9.8} />
          </Row>
          <Row label="custom size">
            <ScoreRing score={5} size={120} />
          </Row>
        </Section>
      </div>
    </main>
  )
}
