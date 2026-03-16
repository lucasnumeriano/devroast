'use server'

import { and, count, eq, gt, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { languageEnum, roasts } from '@/db/schema'

const createRoastInput = z.object({
  code: z.string().min(1).max(5000),
  language: z.enum(languageEnum.enumValues).default('other'),
  roastMode: z.boolean(),
})

export async function createRoast(input: {
  code: string
  language?: string
  roastMode: boolean
}): Promise<{ id: string } | { error: string }> {
  const parsed = createRoastInput.safeParse(input)
  if (!parsed.success) {
    return { error: 'invalid input' }
  }

  const { code, language, roastMode } = parsed.data

  // Extract IP
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? headersList.get('x-real-ip') ?? 'unknown'

  // Rate limiting: 5 roasts/hour per IP
  try {
    const [result] = await db
      .select({ value: count() })
      .from(roasts)
      .where(
        and(
          eq(roasts.ip, ip),
          gt(roasts.createdAt, sql`now() - interval '1 hour'`),
          sql`${roasts.status} != 'failed'`,
        ),
      )

    if (result && result.value >= 5) {
      return { error: 'rate limit exceeded. try again later.' }
    }
  } catch {
    return { error: 'something went wrong' }
  }

  // Create pending roast
  try {
    const lineCount = code.split('\n').length

    const [roast] = await db
      .insert(roasts)
      .values({
        code,
        language,
        lineCount,
        roastMode,
        ip,
        status: 'pending',
      })
      .returning({ id: roasts.id })

    return { id: roast.id }
  } catch {
    return { error: 'something went wrong' }
  }
}
