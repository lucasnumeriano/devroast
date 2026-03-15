import type { BundledLanguage } from 'shiki'
import { twMerge } from 'tailwind-merge'
import { CodeBlock } from '@/components/ui/code-block'

type LeaderboardEntryProps = {
  rank: number
  score: string
  code: string
  language: string
  lineCount: number
  className?: string
}

function LeaderboardEntry({
  rank,
  score,
  code,
  language,
  lineCount,
  className,
}: LeaderboardEntryProps) {
  return (
    <div className={twMerge('border border-zinc-800', className)}>
      {/* Meta Row */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-5">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-600">#</span>
            <span className="font-mono text-sm font-bold text-amber-500">{rank}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-600">score:</span>
            <span className="font-mono text-sm font-bold text-red-500">{score}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-500">{language}</span>
          <span className="font-mono text-xs text-zinc-600">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
      </div>

      {/* Code Block */}
      <CodeBlock
        code={code}
        lang={language as BundledLanguage}
        className={twMerge('h-30 bg-[#111111]', '[&_pre]:p-3.5 [&_pre]:text-xs')}
      />
    </div>
  )
}

export { LeaderboardEntry, type LeaderboardEntryProps }
