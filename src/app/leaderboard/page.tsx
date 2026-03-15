import type { Metadata } from 'next'
import { LeaderboardEntry } from '@/components/ui/leaderboard-entry'
import { caller } from '@/trpc/server'

export const metadata: Metadata = {
  title: 'shame leaderboard | devroast',
  description: 'the most roasted code on the internet, ranked by shame.',
}

export default async function LeaderboardPage() {
  const [entries, stats] = await Promise.all([
    caller.leaderboard.getEntries({ limit: 20 }),
    caller.leaderboard.getStats(),
  ])

  return (
    <main className="flex flex-col items-center px-10 pt-10 pb-10">
      <div className="w-full max-w-240">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-emerald-500">{'>'}</span>
            <h1 className="font-mono text-3xl font-bold text-zinc-50">shame_leaderboard</h1>
          </div>

          {/* Subtitle */}
          <p className="font-sans text-sm text-zinc-500">
            {'// the most roasted code on the internet'}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-zinc-600">
              {stats.totalRoasts.toLocaleString()} submissions
            </span>
            <span className="font-sans text-xs text-zinc-600">&middot;</span>
            <span className="font-sans text-xs text-zinc-600">
              avg score: {stats.avgScore.toFixed(1)}/10
            </span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="mt-10 flex flex-col gap-5">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <span className="font-mono text-sm text-zinc-600">
                {'// no roasts yet. be the first to get roasted.'}
              </span>
            </div>
          ) : (
            entries.map((entry, index) => (
              <LeaderboardEntry
                key={entry.id}
                rank={index + 1}
                score={entry.score.toFixed(1)}
                code={entry.code}
                language={entry.language}
                lineCount={entry.lineCount}
              />
            ))
          )}
        </section>
      </div>
    </main>
  )
}
