import { initTRPC } from '@trpc/server'
import { db } from '@/db'

export const createTRPCContext = async (opts?: { headers: Headers }) => {
  return {
    db,
    headers: opts?.headers ?? new Headers(),
  }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
