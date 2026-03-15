import { createTRPCRouter } from '../init'
import { leaderboardRouter } from './leaderboard'
import { roastRouter } from './roast'

export const appRouter = createTRPCRouter({
  roast: roastRouter,
  leaderboard: leaderboardRouter,
})

export type AppRouter = typeof appRouter
