'use client'

import NumberFlow from '@number-flow/react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

function LeaderboardStats() {
  const trpc = useTRPC()
  const { data } = useQuery({
    ...trpc.leaderboard.getStats.queryOptions(),
    staleTime: 3600 * 1000,
  })

  return (
    <div className="flex items-center gap-2">
      <span className="font-sans text-xs text-zinc-600">
        <NumberFlow
          value={data?.totalRoasts ?? 0}
          format={{ useGrouping: true }}
          className="font-sans text-xs text-zinc-600"
        />
        {' submissions'}
      </span>
      <span className="font-sans text-xs text-zinc-600">&middot;</span>
      <span className="font-sans text-xs text-zinc-600">
        {'avg score: '}
        <NumberFlow
          value={data?.avgScore ?? 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="font-sans text-xs text-zinc-600"
        />
        {'/10'}
      </span>
    </div>
  )
}

export { LeaderboardStats }
