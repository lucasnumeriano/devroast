import { drizzle } from 'drizzle-orm/postgres-js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const db = drizzle(databaseUrl, { casing: 'snake_case' })
