import type { Metadata } from 'next'
import { cacheLife } from 'next/cache'
import { LeaderboardEntry } from '@/components/ui/leaderboard-entry'
import { cachedCaller } from '@/trpc/server'
import { CodeExpandButton } from '../code-expand-button'
import { LeaderboardStats } from './leaderboard-stats'

export const metadata: Metadata = {
  title: 'shame leaderboard | devroast',
  description: 'the most roasted code on the internet, ranked by shame.',
}

export default async function LeaderboardPage() {
  'use cache'
  cacheLife('leaderboard')

  const entries = await cachedCaller.leaderboard.getEntries({ limit: 20 })

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
          <LeaderboardStats />
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
              <div key={entry.id}>
                <LeaderboardEntry
                  rank={index + 1}
                  score={(entry.score ?? 0).toFixed(1)}
                  code={entry.code}
                  language={entry.language}
                  lineCount={entry.lineCount}
                />
                <CodeExpandButton
                  roastId={entry.id}
                  language={entry.language}
                  lineCount={entry.lineCount}
                />
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  )
}
