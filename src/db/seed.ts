import { faker } from '@faker-js/faker'
import { drizzle } from 'drizzle-orm/postgres-js'
import { roastIssues, roasts } from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const db = drizzle(databaseUrl, { casing: 'snake_case' })

const LANGUAGES = [
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
] as const

const VERDICTS = ['needs_serious_help', 'bad', 'mediocre', 'decent', 'clean_code'] as const

const SEVERITIES = ['critical', 'warning', 'good'] as const

function verdictForScore(score: number): (typeof VERDICTS)[number] {
  if (score <= 2) return 'needs_serious_help'
  if (score <= 4) return 'bad'
  if (score <= 6) return 'mediocre'
  if (score <= 8) return 'decent'
  return 'clean_code'
}

const ROAST_QUOTES = [
  'this code was written during a power outage... in 2005.',
  "i've seen better error handling in a calculator app.",
  'whoever wrote this clearly has a personal vendetta against maintainability.',
  'this code is the software equivalent of a dumpster fire.',
  'the only thing consistent here is the inconsistency.',
  'did you write this code or did your cat walk on the keyboard?',
  "i'm not saying it's bad, but it made my linter cry.",
  'this codebase has more red flags than a communist parade.',
  'you managed to violate every SOLID principle in a single file. impressive.',
  'this code runs on hopes, dreams, and undefined behavior.',
  "i've seen spaghetti with better structure than this.",
  'the variable naming suggests this was written at 3am after six energy drinks.',
  "this code doesn't just have bugs, it has an ecosystem.",
  'congratulations, you reinvented the wheel — but made it square.',
  'even ChatGPT would refuse to take credit for this.',
  'this is what happens when you skip the docs and go straight to Stack Overflow.',
  'your try-catch blocks are catching nothing but bad vibes.',
  "i'd review this code, but I don't have enough therapy sessions left.",
  'this function does so many things it needs its own org chart.',
  "at least it compiles. that's... something.",
  'surprisingly clean. someone actually reads documentation.',
  'well-structured code. the bar is low, but you cleared it.',
  'not bad. not great. the Honda Civic of codebases.',
  "your code is almost readable. we're making progress.",
  'this is acceptable code. and yes, that is the highest compliment I give.',
  "decent separation of concerns. I'm mildly impressed.",
  'actually well-typed. are you sure you wrote this yourself?',
  'clean code alert. someone took their Adderall today.',
  "you clearly know what you're doing. don't let it go to your head.",
  'this code is so clean it makes me uncomfortable.',
]

const ISSUE_TEMPLATES: {
  severity: (typeof SEVERITIES)[number]
  title: string
  description: string
}[] = [
  {
    severity: 'critical',
    title: 'using var instead of const/let',
    description:
      'var is function-scoped and leads to hoisting bugs. Always prefer const for immutable bindings and let for mutable ones.',
  },
  {
    severity: 'critical',
    title: 'no error handling',
    description:
      'This code has zero error handling. Any runtime exception will crash the process silently. Add try-catch blocks or error boundaries.',
  },
  {
    severity: 'critical',
    title: 'SQL injection vulnerability',
    description:
      'User input is being concatenated directly into SQL queries. Use parameterized queries or an ORM to prevent injection attacks.',
  },
  {
    severity: 'critical',
    title: 'hardcoded credentials',
    description:
      'API keys and passwords are hardcoded in the source. Move these to environment variables immediately.',
  },
  {
    severity: 'critical',
    title: 'memory leak in event listener',
    description:
      'Event listeners are added but never removed. This will cause memory leaks in long-running processes.',
  },
  {
    severity: 'warning',
    title: 'inconsistent naming conventions',
    description:
      'The codebase mixes camelCase, snake_case, and PascalCase without any pattern. Pick one convention and stick to it.',
  },
  {
    severity: 'warning',
    title: 'deeply nested callbacks',
    description:
      'Callback hell detected. Consider refactoring to async/await or breaking the logic into smaller functions.',
  },
  {
    severity: 'warning',
    title: 'unused imports',
    description:
      'Several modules are imported but never used. Remove them to reduce bundle size and improve clarity.',
  },
  {
    severity: 'warning',
    title: 'magic numbers everywhere',
    description:
      'Numeric literals like 86400, 1024, and 3.14 appear without explanation. Extract them into named constants.',
  },
  {
    severity: 'warning',
    title: 'no input validation',
    description:
      'User inputs are used directly without validation. Add schema validation (e.g., Zod) to prevent malformed data.',
  },
  {
    severity: 'warning',
    title: 'console.log in production code',
    description:
      'Multiple console.log statements found. Replace with a proper logging library or remove before shipping.',
  },
  {
    severity: 'warning',
    title: 'any type used extensively',
    description:
      'TypeScript is only useful if you actually use types. Replace `any` with proper type definitions.',
  },
  {
    severity: 'good',
    title: 'clear naming conventions',
    description:
      'Variable and function names are descriptive and follow a consistent pattern. Well done.',
  },
  {
    severity: 'good',
    title: 'proper use of TypeScript',
    description:
      'Types are well-defined and provide good documentation. Generic types are used appropriately.',
  },
  {
    severity: 'good',
    title: 'good separation of concerns',
    description:
      'Logic is well-separated into modules with clear responsibilities. Each function does one thing.',
  },
  {
    severity: 'good',
    title: 'comprehensive error handling',
    description: 'Errors are caught, logged, and handled gracefully. Edge cases are accounted for.',
  },
]

const CODE_SNIPPETS = [
  `function getData() {
  var data = fetch('/api/data')
  return data
}`,
  `const handleClick = (e) => {
  console.log('clicked')
  setState(e.target.value)
  console.log('done')
}`,
  `export async function getUsers() {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}`,
  `class UserService {
  constructor(db) {
    this.db = db
  }
  async findById(id) {
    return this.db.query('SELECT * FROM users WHERE id = ' + id)
  }
}`,
  `import { useState, useEffect } from 'react'

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}`,
  `def calculate_total(items):
    total = 0
    for item in items:
        if item['type'] == 'product':
            total += item['price'] * item['quantity']
        elif item['type'] == 'service':
            total += item['price']
    return total`,
  `func main() {
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(200)
        w.Write([]byte("ok"))
    })
    log.Fatal(http.ListenAndServe(":8080", nil))
}`,
  `SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;`,
  `pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}`,
  `public class Singleton {
    private static Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}`,
  `const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find()
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})`,
  `.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-primary);
  transition: transform 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
}`,
]

const DIFF_TEMPLATES = [
  `--- your_code.ts
+++ improved_code.ts
@@ -1,5 +1,7 @@
-function getData() {
-  var data = fetch('/api/data')
-  return data
+async function getData() {
+  const response = await fetch('/api/data')
+  if (!response.ok) {
+    throw new Error(\`HTTP error: \${response.status}\`)
+  }
+  return response.json()
 }`,
  `--- your_code.ts
+++ improved_code.ts
@@ -1,4 +1,6 @@
-const handleClick = (e) => {
-  console.log('clicked')
-  setState(e.target.value)
+const handleClick = (e: React.ChangeEvent<HTMLInputElement>) => {
+  const { value } = e.target
+  setState(value)
 }`,
  `--- your_code.ts
+++ improved_code.ts
@@ -3,3 +3,5 @@
   async findById(id) {
-    return this.db.query('SELECT * FROM users WHERE id = ' + id)
+    return this.db.query(
+      'SELECT * FROM users WHERE id = $1',
+      [id]
+    )
   }`,
  null,
  null,
]

function generateRoast() {
  const score = Math.round(faker.number.float({ min: 0, max: 10, fractionDigits: 1 }) * 10) / 10
  const language = faker.helpers.arrayElement(LANGUAGES)
  const code = faker.helpers.arrayElement(CODE_SNIPPETS)
  const lineCount = code.split('\n').length
  const diff = faker.helpers.arrayElement(DIFF_TEMPLATES)

  return {
    code,
    language,
    lineCount,
    roastMode: faker.datatype.boolean({ probability: 0.4 }),
    status: 'completed' as const,
    score,
    verdict: verdictForScore(score),
    roastQuote: faker.helpers.arrayElement(ROAST_QUOTES),
    suggestedDiff: diff,
    diffFileName: diff ? 'your_code.ts -> improved_code.ts' : null,
    createdAt: faker.date.between({
      from: new Date('2025-01-01'),
      to: new Date(),
    }),
  }
}

function generateIssues(roastId: string, score: number) {
  const issueCount =
    score <= 3 ? faker.number.int({ min: 3, max: 4 }) : faker.number.int({ min: 1, max: 4 })

  const availableIssues = [...ISSUE_TEMPLATES]
  const selected = faker.helpers.arrayElements(availableIssues, issueCount)

  // Weight severities by score: low scores get more criticals, high scores get more goods
  if (score <= 3) {
    // Ensure at least one critical
    const hasCritical = selected.some((i) => i.severity === 'critical')
    if (!hasCritical && availableIssues.some((i) => i.severity === 'critical')) {
      const criticals = availableIssues.filter((i) => i.severity === 'critical')
      selected[0] = faker.helpers.arrayElement(criticals)
    }
  } else if (score >= 8) {
    // Ensure at least one good
    const hasGood = selected.some((i) => i.severity === 'good')
    if (!hasGood && availableIssues.some((i) => i.severity === 'good')) {
      const goods = availableIssues.filter((i) => i.severity === 'good')
      selected[0] = faker.helpers.arrayElement(goods)
    }
  }

  return selected.map((issue, i) => ({
    roastId,
    severity: issue.severity,
    title: issue.title,
    description: issue.description,
    position: i,
  }))
}

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (issues first due to FK constraint)
  await db.delete(roastIssues)
  await db.delete(roasts)
  console.log('Cleared existing data.')

  const TOTAL_ROASTS = 100
  const roastValues = Array.from({ length: TOTAL_ROASTS }, () => generateRoast())

  // Insert all roasts and get their IDs
  const insertedRoasts = await db.insert(roasts).values(roastValues).returning({ id: roasts.id })
  console.log(`Inserted ${insertedRoasts.length} roasts.`)

  // Generate and insert all issues
  const allIssues = insertedRoasts.flatMap((roast, i) => {
    const score = roastValues[i].score
    return generateIssues(roast.id, score)
  })

  if (allIssues.length > 0) {
    await db.insert(roastIssues).values(allIssues)
  }
  console.log(`Inserted ${allIssues.length} issues.`)

  console.log('Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
