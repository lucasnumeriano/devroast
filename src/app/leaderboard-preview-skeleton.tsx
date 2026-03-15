function EntryRowSkeleton() {
  return (
    <div className="border border-zinc-800">
      {/* Meta Row */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-600">#</span>
            <span className="inline-block h-3.5 w-4 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-600">score:</span>
            <span className="inline-block h-3.5 w-6 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-16 animate-pulse rounded bg-zinc-800" />
          <span className="inline-block h-3 w-12 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>

      {/* Code Block Skeleton */}
      <div className="flex h-30 flex-col gap-2 bg-[#111111] p-3.5">
        <span className="inline-block h-3 w-3/4 animate-pulse rounded bg-zinc-800/60" />
        <span className="inline-block h-3 w-1/2 animate-pulse rounded bg-zinc-800/60" />
        <span className="inline-block h-3 w-2/3 animate-pulse rounded bg-zinc-800/60" />
      </div>
    </div>
  )
}

export function LeaderboardPreviewSkeleton() {
  return (
    <section className="w-full max-w-240 space-y-6">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-emerald-500">{'//'}</span>
          <span className="font-mono text-sm font-bold text-zinc-50">shame_leaderboard</span>
        </div>
        <span className="inline-block h-7 w-24 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Subtitle */}
      <p className="font-sans text-sm text-zinc-600">
        {'// the worst code on the internet, ranked by shame'}
      </p>

      {/* Entry Skeletons */}
      <div className="flex flex-col gap-5">
        <EntryRowSkeleton />
        <EntryRowSkeleton />
        <EntryRowSkeleton />
      </div>

      {/* Footer Skeleton */}
      <div className="flex justify-center py-4">
        <span className="inline-block h-3 w-52 animate-pulse rounded bg-zinc-800" />
      </div>
    </section>
  )
}
