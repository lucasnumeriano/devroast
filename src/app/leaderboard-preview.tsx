import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaderboardEntry } from '@/components/ui/leaderboard-entry'
import { caller } from '@/trpc/server'
import { CodeExpandButton } from './code-expand-button'

export async function LeaderboardPreview() {
  const [entries, stats] = await Promise.all([
    caller.leaderboard.getEntries({ limit: 3 }),
    caller.leaderboard.getStats(),
  ])

  return (
    <section className="w-full max-w-240 space-y-6">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-emerald-500">{'//'}</span>
          <span className="font-mono text-sm font-bold text-zinc-50">shame_leaderboard</span>
        </div>
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm">
            $ view_all {'>>'}
          </Button>
        </Link>
      </div>

      {/* Subtitle */}
      <p className="font-sans text-sm text-zinc-600">
        {'// the worst code on the internet, ranked by shame'}
      </p>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-zinc-800 py-20">
          <span className="font-mono text-sm text-zinc-600">
            {'// no roasts yet. be the first to get roasted.'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {entries.map((entry, index) => (
            <div key={entry.id}>
              <LeaderboardEntry
                rank={index + 1}
                score={entry.score.toFixed(1)}
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
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-center py-4">
        <span className="font-sans text-xs text-zinc-600">
          {`showing top ${Math.min(3, entries.length)} of ${stats.totalRoasts.toLocaleString()} \u00b7 `}
        </span>
        <Link
          href="/leaderboard"
          className="font-sans text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {'view full leaderboard >>'}
        </Link>
      </div>
    </section>
  )
}
