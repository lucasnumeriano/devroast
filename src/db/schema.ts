import { boolean, integer, pgEnum, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const issueSeverityEnum = pgEnum('issue_severity', ['critical', 'warning', 'good'])

export const verdictEnum = pgEnum('verdict', [
  'needs_serious_help',
  'bad',
  'mediocre',
  'decent',
  'clean_code',
])

export const languageEnum = pgEnum('language', [
  'javascript',
  'typescript',
  'sql',
  'python',
  'go',
  'rust',
  'java',
  'css',
  'html',
  'other',
])

export const roasts = pgTable('roasts', {
  id: uuid().defaultRandom().primaryKey(),
  code: text().notNull(),
  language: languageEnum().notNull().default('javascript'),
  lineCount: integer().notNull(),
  roastMode: boolean().notNull().default(false),
  score: real().notNull(),
  verdict: verdictEnum().notNull(),
  roastQuote: text().notNull(),
  suggestedDiff: text(),
  diffFileName: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const roastIssues = pgTable('roast_issues', {
  id: uuid().defaultRandom().primaryKey(),
  roastId: uuid()
    .notNull()
    .references(() => roasts.id, { onDelete: 'cascade' }),
  severity: issueSeverityEnum().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  position: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})
