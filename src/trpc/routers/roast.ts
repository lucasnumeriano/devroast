import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { roastIssues, roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const roastRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [roast] = await ctx.db.select().from(roasts).where(eq(roasts.id, input.id)).limit(1)

      if (!roast) {
        return null
      }

      const issues = await ctx.db
        .select()
        .from(roastIssues)
        .where(eq(roastIssues.roastId, input.id))
        .orderBy(roastIssues.position)

      return {
        ...roast,
        issues,
      }
    }),
})
