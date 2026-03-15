# Drizzle ORM — Especificação de Implementação

Especificação para integrar **Drizzle ORM** com **PostgreSQL** no projeto devroast, incluindo schema de banco de dados, Docker Compose e plano de implementação.

---

## 1. Visão Geral do Modelo de Dados

Baseado na análise das 4 telas do design (Code Input, Roast Results, Shame Leaderboard, OG Image) e do README, o app possui o seguinte fluxo de dados:

1. Usuário submete código com opção de roast mode
2. IA analisa o código e retorna: nota (0-10), veredicto, roast quote, issues detalhadas e diff sugerido
3. A submissão aparece no shame leaderboard ranqueada por nota (pior = mais alto no ranking)
4. Cada submissão gera uma OG image para compartilhamento

---

## 2. Enums

```typescript
// src/db/schema.ts

import { pgEnum } from 'drizzle-orm/pg-core'

// Severidade dos issues encontrados na análise
// Derivado dos badges do design: critical (vermelho), warning (amber), good (verde)
export const issueSeverityEnum = pgEnum('issue_severity', [
  'critical',
  'warning',
  'good',
])

// Veredicto final do roast
// Derivado do OG Image e Roast Results: needs_serious_help, mediocre, decent, clean_code
export const verdictEnum = pgEnum('verdict', [
  'needs_serious_help',
  'bad',
  'mediocre',
  'decent',
  'clean_code',
])

// Linguagens suportadas no editor
// Derivado do leaderboard: javascript, typescript, sql (expandível)
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
```

---

## 3. Tabelas

### 3.1 `roasts` — Tabela principal de submissões

Cada linha representa uma submissão de código + o resultado da análise da IA.

```typescript
import { pgTable, uuid, text, real, boolean, integer, timestamp } from 'drizzle-orm/pg-core'

export const roasts = pgTable('roasts', {
  // Identificador único
  id: uuid('id').defaultRandom().primaryKey(),

  // Código submetido pelo usuário (texto completo)
  code: text('code').notNull(),

  // Linguagem detectada ou selecionada
  language: languageEnum('language').notNull().default('javascript'),

  // Número de linhas do código submetido
  lineCount: integer('line_count').notNull(),

  // Se o roast mode estava ativo (sarcasmo máximo)
  roastMode: boolean('roast_mode').notNull().default(false),

  // Nota de 0 a 10 (com decimal, ex: 3.5)
  score: real('score').notNull(),

  // Veredicto final (needs_serious_help, mediocre, decent, clean_code)
  verdict: verdictEnum('verdict').notNull(),

  // Frase de roast/quote gerada pela IA
  // Ex: "this code was written during a power outage... in 2005."
  roastQuote: text('roast_quote').notNull(),

  // Diff sugerido pela IA (texto completo do diff unificado)
  suggestedDiff: text('suggested_diff'),

  // Nome do arquivo no header do diff (ex: "your_code.ts → improved_code.ts")
  diffFileName: text('diff_file_name'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**Campos derivados do design:**
- `score` + `verdict` → Score Ring + verdict badge (Screen 2 e 4)
- `code` + `language` + `lineCount` → Code Preview e meta info (Screen 2, 3, 4)
- `roastQuote` → Título do roast summary e OG Image quote
- `suggestedDiff` → Diff Section (Screen 2)
- `roastMode` → Toggle state (Screen 1)

### 3.2 `roast_issues` — Issues detalhados da análise

Cada issue é um problema (ou ponto positivo) encontrado no código, exibido na Issues Grid da Screen 2.

```typescript
export const roastIssues = pgTable('roast_issues', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Referência ao roast pai
  roastId: uuid('roast_id')
    .notNull()
    .references(() => roasts.id, { onDelete: 'cascade' }),

  // Severidade: critical, warning, good
  severity: issueSeverityEnum('severity').notNull(),

  // Título curto do issue
  // Ex: "using var instead of const/let", "clear naming conventions"
  title: text('title').notNull(),

  // Descrição detalhada do issue
  // Ex: "var is function-scoped and leads to hoisting bugs..."
  description: text('description').notNull(),

  // Ordem de exibição na grid
  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**Campos derivados do design (Screen 2 — Issues Grid):**
- `severity` → Badge com dot colorido (critical=vermelho, warning=amber, good=verde)
- `title` → Título do card (JetBrains Mono, 13px, bold)
- `description` → Descrição (IBM Plex Mono, 12px)
- `position` → Ordenação na grid (2 colunas, 2 linhas = 4 cards)

---

## 4. Relations (Drizzle `relations`)

```typescript
import { relations } from 'drizzle-orm'

export const roastsRelations = relations(roasts, ({ many }) => ({
  issues: many(roastIssues),
}))

export const roastIssuesRelations = relations(roastIssues, ({ one }) => ({
  roast: one(roasts, {
    fields: [roastIssues.roastId],
    references: [roasts.id],
  }),
}))
```

---

## 5. Índices

```typescript
import { index } from 'drizzle-orm/pg-core'

// Na tabela roasts, para o leaderboard (ordenação por score ASC = piores primeiro)
// e para queries recentes
export const roasts = pgTable('roasts', {
  // ... colunas acima
}, (table) => [
  index('roasts_score_idx').on(table.score),
  index('roasts_created_at_idx').on(table.createdAt),
])
```

---

## 6. Docker Compose

```yaml
# docker-compose.yml

services:
  postgres:
    image: postgres:17-alpine
    container_name: devroast-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 7. Variáveis de Ambiente

```env
# .env.local
DATABASE_URL="postgresql://devroast:devroast@localhost:5432/devroast"
```

Adicionar `.env.local` ao `.gitignore` (já coberto pelo pattern `.env*` existente).

Criar um `.env.example` para documentação:

```env
# .env.example
DATABASE_URL="postgresql://devroast:devroast@localhost:5432/devroast"
```

---

## 8. Estrutura de Arquivos

```
devroast/
├── docker-compose.yml              # PostgreSQL
├── drizzle.config.ts               # Config do Drizzle Kit (migrations)
├── .env.example                    # Template de env vars
├── src/
│   └── db/
│       ├── index.ts                # Conexão + instância do Drizzle
│       ├── schema.ts               # Enums, tabelas, relations, índices
│       └── migrations/             # Geradas pelo drizzle-kit
```

---

## 9. Configuração do Drizzle Kit

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## 10. Conexão com o Banco

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

---

## 11. Queries Esperadas

### Leaderboard (Screen 1 preview + Screen 3 completo)

```typescript
// Top N piores códigos, ordenados por score ascendente
const leaderboard = await db.query.roasts.findMany({
  orderBy: (roasts, { asc }) => [asc(roasts.score)],
  limit: 10,
})
```

### Resultado completo de um roast (Screen 2)

```typescript
// Buscar roast com issues
const result = await db.query.roasts.findFirst({
  where: (roasts, { eq }) => eq(roasts.id, roastId),
  with: {
    issues: {
      orderBy: (issues, { asc }) => [asc(issues.position)],
    },
  },
})
```

### Stats globais (Footer hint)

```typescript
// "2,847 codes roasted" + "avg score: 4.2/10"
const stats = await db
  .select({
    totalRoasts: count(),
    avgScore: avg(roasts.score),
  })
  .from(roasts)
```

### Inserir um novo roast (após resposta da IA)

```typescript
const [newRoast] = await db.insert(roasts).values({
  code,
  language,
  lineCount,
  roastMode,
  score,
  verdict,
  roastQuote,
  suggestedDiff,
  diffFileName,
}).returning()

// Inserir issues em batch
await db.insert(roastIssues).values(
  issues.map((issue, i) => ({
    roastId: newRoast.id,
    severity: issue.severity,
    title: issue.title,
    description: issue.description,
    position: i,
  }))
)
```

---

## 12. To-Dos de Implementação

### Fase 1 — Infraestrutura

- [ ] Instalar dependências: `pnpm add drizzle-orm postgres`
- [ ] Instalar dev dependencies: `pnpm add -D drizzle-kit`
- [ ] Criar `docker-compose.yml` na raiz do projeto
- [ ] Criar `.env.example` com `DATABASE_URL`
- [ ] Criar `.env.local` com credenciais locais
- [ ] Subir o Postgres: `docker compose up -d`

### Fase 2 — Schema e Migrations

- [ ] Criar `src/db/schema.ts` com enums, tabelas, relations e índices
- [ ] Criar `src/db/index.ts` com conexão ao banco
- [ ] Criar `drizzle.config.ts` na raiz
- [ ] Gerar migration inicial: `pnpm drizzle-kit generate`
- [ ] Aplicar migration: `pnpm drizzle-kit migrate`
- [ ] Verificar schema no Drizzle Studio: `pnpm drizzle-kit studio`

### Fase 3 — Scripts no package.json

- [ ] Adicionar script `db:generate` → `drizzle-kit generate`
- [ ] Adicionar script `db:migrate` → `drizzle-kit migrate`
- [ ] Adicionar script `db:studio` → `drizzle-kit studio`
- [ ] Adicionar script `db:push` → `drizzle-kit push` (dev rápido)

### Fase 4 — Integração com o App

- [ ] Criar server action ou API route para submeter código e salvar roast
- [ ] Substituir dados hardcoded do leaderboard preview (Screen 1) por query real
- [ ] Criar página `/leaderboard` com query paginada
- [ ] Criar página `/roast/[id]` para exibir resultado completo (Screen 2)
- [ ] Implementar rota de OG Image dinâmica usando dados do banco

---

## 13. Diagrama ER

```
┌─────────────────────────┐       ┌─────────────────────────┐
│         roasts           │       │      roast_issues        │
├─────────────────────────┤       ├─────────────────────────┤
│ id          uuid (PK)    │──┐    │ id          uuid (PK)    │
│ code        text          │  │    │ roast_id    uuid (FK)    │
│ language    language_enum │  └───│ severity    severity_enum│
│ line_count  integer       │       │ title       text          │
│ roast_mode  boolean       │       │ description text          │
│ score       real          │       │ position    integer       │
│ verdict     verdict_enum  │       │ created_at  timestamptz   │
│ roast_quote text          │       └─────────────────────────┘
│ suggested_diff text       │
│ diff_file_name text       │
│ created_at  timestamptz   │
└─────────────────────────┘
```

---

## 14. Decisões de Design

| Decisão | Justificativa |
|---|---|
| **Sem tabela de usuários** | O app não tem autenticação. Submissões são anônimas conforme o design. |
| **`real` para score** | Score vai de 0 a 10 com decimal (ex: 3.5). `real` é suficiente. |
| **UUID como PK** | Permite usar o ID na URL (`/roast/[id]`) sem expor sequência. |
| **Cascade delete em issues** | Se um roast for deletado, seus issues vão junto. |
| **Enum para language** | Lista fixa e expansível. Inclui `other` como fallback. |
| **Diff como texto** | O diff é renderizado client-side pelo componente `DiffLine`. Armazenar como texto unificado é simples e suficiente. |
| **Sem tabela separada de stats** | `count()` e `avg()` são performáticos o suficiente para o volume esperado. Materializar depois se necessário. |
