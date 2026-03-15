'use client'

import NumberFlow from '@number-flow/react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

export function StatsBar() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.leaderboard.getStats.queryOptions())

  return (
    <section className="mt-8 flex items-center justify-center gap-6">
      <span className="font-sans text-xs text-zinc-600">
        <NumberFlow
          value={data?.totalRoasts ?? 0}
          format={{ useGrouping: true }}
          className="font-sans text-xs text-zinc-600"
        />
        {' codes roasted'}
      </span>
      <span className="font-mono text-xs text-zinc-600">&middot;</span>
      <span className="font-sans text-xs text-zinc-600">
        {'avg score: '}
        <NumberFlow
          value={data?.avgScore ?? 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="font-sans text-xs text-zinc-600"
        />
        {'/10'}
      </span>
    </section>
  )
}
