import type { Metadata } from 'next'
import { LeaderboardEntry } from '@/components/ui/leaderboard-entry'

export const metadata: Metadata = {
  title: 'shame leaderboard | devroast',
  description: 'the most roasted code on the internet, ranked by shame.',
}

const leaderboardEntries = [
  {
    rank: 1,
    score: '1.2',
    language: 'javascript',
    code: `eval(prompt("enter code"))
document.write(response)
// trust the user lol`,
  },
  {
    rank: 2,
    score: '1.8',
    language: 'typescript',
    code: `if (x == true) { return true; }
else if (x == false) { return false; }
else { return !false; }`,
  },
  {
    rank: 3,
    score: '2.1',
    language: 'sql',
    code: `SELECT * FROM users WHERE 1=1
-- TODO: add authentication`,
  },
  {
    rank: 4,
    score: '2.3',
    language: 'java',
    code: `catch (e) {
  // ignore
}`,
  },
  {
    rank: 5,
    score: '2.5',
    language: 'javascript',
    code: `const sleep = (ms) =>
  new Date(Date.now() + ms)
  while(new Date() < end) {}`,
  },
]

export default function LeaderboardPage() {
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
            <span className="font-sans text-xs text-zinc-600">2,847 submissions</span>
            <span className="font-sans text-xs text-zinc-600">&middot;</span>
            <span className="font-sans text-xs text-zinc-600">avg score: 4.2/10</span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="mt-10 flex flex-col gap-5">
          {leaderboardEntries.map((entry) => {
            const lineCount = entry.code.split('\n').length
            return (
              <LeaderboardEntry
                key={entry.rank}
                rank={entry.rank}
                score={entry.score}
                code={entry.code}
                language={entry.language}
                lineCount={lineCount}
              />
            )
          })}
        </section>
      </div>
    </main>
  )
}
