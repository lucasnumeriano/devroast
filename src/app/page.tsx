import { Suspense } from 'react'
import { CodeInputSection } from './code-input-section'
import { LeaderboardPreview } from './leaderboard-preview'
import { LeaderboardPreviewSkeleton } from './leaderboard-preview-skeleton'
import { StatsBar } from './stats-bar'

export default function Home() {
  return (
    <main className="flex flex-col items-center px-10 pt-20 pb-0">
      {/* Hero */}
      <section className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-4xl font-bold text-emerald-500">$</span>
          <h1 className="font-mono text-4xl font-bold text-zinc-50">
            paste your code. get roasted.
          </h1>
        </div>
        <p className="font-sans text-sm text-zinc-600">
          {"// drop your code below and we'll rate it \u2014 brutally honest or full roast mode"}
        </p>
      </section>

      {/* Code Editor + Actions */}
      <Suspense>
        <CodeInputSection />
      </Suspense>

      {/* Footer Stats */}
      <StatsBar />

      {/* Spacer */}
      <div className="h-15" />

      {/* Leaderboard Preview */}
      <Suspense fallback={<LeaderboardPreviewSkeleton />}>
        <LeaderboardPreview />
      </Suspense>

      {/* Bottom Spacer */}
      <div className="h-15" />
    </main>
  )
}
