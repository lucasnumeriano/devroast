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
  'c',
  'cpp',
  'cs',
  'php',
  'json',
  'markdown',
  'yaml',
  'shell',
  'ruby',
  'kotlin',
  'swift',
  'other',
])

export const roastStatusEnum = pgEnum('roast_status', ['pending', 'completed', 'failed'])

export const roasts = pgTable('roasts', {
  id: uuid().defaultRandom().primaryKey(),
  code: text().notNull(),
  language: languageEnum().notNull().default('javascript'),
  lineCount: integer().notNull(),
  roastMode: boolean().notNull().default(false),
  status: roastStatusEnum().notNull().default('pending'),
  ip: text(),
  score: real(),
  verdict: verdictEnum(),
  roastQuote: text(),
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
