import { asc, avg, count } from 'drizzle-orm'
import { z } from 'zod'
import { roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const leaderboardRouter = createTRPCRouter({
  getEntries: baseProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10
      const offset = input?.offset ?? 0

      const entries = await ctx.db
        .select()
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(limit)
        .offset(offset)

      return entries
    }),

  getStats: baseProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db
      .select({
        totalRoasts: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts)

    return {
      totalRoasts: stats?.totalRoasts ?? 0,
      avgScore: stats?.avgScore ? Number.parseFloat(stats.avgScore) : 0,
    }
  }),
})
