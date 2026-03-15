# tRPC — Camada de API com Integração SSR/Server Components

## Resumo

Integrar **tRPC v11** com **TanStack React Query** como camada de API do devroast, substituindo os dados hardcoded atuais por queries reais ao banco. A integração segue o padrão oficial do tRPC para **Next.js App Router**, com suporte a prefetch em Server Components, hydration para Client Components e um server caller para acesso direto em RSC.

---

## Pesquisa Realizada

### Abordagens de integração tRPC + Next.js App Router

O tRPC v11 oferece duas documentações complementares para integração com RSC:

| Abordagem | Doc | Diferença |
|---|---|---|
| **Next.js App Router (dedicada)** | `/docs/client/nextjs/app-router-setup` | Context aceita `headers` para reuso entre API route e RSC caller |
| **RSC genérica** | `/docs/client/tanstack-react-query/server-components` | Context mais simples (sem headers), usa `cache()` do React |

A abordagem **Next.js App Router** é recomendada pela doc oficial ("See the dedicated Next.js App Router setup guide for a streamlined walkthrough tailored to Next.js"). A diferença principal é que o `createTRPCContext` aceita `{ headers: Headers }`, permitindo que o context seja compartilhado entre o API route handler (que recebe `req.headers`) e o server caller (que usa `headers()` do `next/headers`).

### Client: `@trpc/tanstack-react-query` vs `@trpc/react-query` (classic)

| Feature | `@trpc/tanstack-react-query` (novo) | `@trpc/react-query` (classic) |
|---|---|---|
| API | `queryOptions()` / `mutationOptions()` | `trpc.hello.useQuery()` |
| TanStack Query native | Sim | Wrapper |
| RSC support | Nativo com `createTRPCOptionsProxy` | Limitado |
| Recomendação oficial | Sim | Legacy |

O client novo (`@trpc/tanstack-react-query`) gera factories de `QueryOptions` e `MutationOptions` que se integram nativamente com hooks do TanStack React Query (`useQuery`, `useMutation`, `useSuspenseQuery`). A doc oficial recomenda esse client.

### Validação: Zod vs sem validação

O projeto já usa tipos TypeScript para definir os dados. tRPC recomenda Zod para validação de input. Como o projeto não tem Zod instalado, precisamos adicioná-lo. Zod é leve (~13KB gzip) e é o padrão do ecossistema tRPC.

---

## Decisão Arquitetural

- **tRPC v11** com **`@trpc/tanstack-react-query`** (client novo, não o classic)
- **Next.js App Router setup** com `createTRPCContext` aceitando `{ headers: Headers }`
- **Zod** para validação de inputs nas procedures
- **Sem `superjson`** — o schema do banco usa tipos nativos (string, number, boolean, Date), e `Date` pode ser serializado como ISO string no output. Evita dependência extra.
- **Fetch adapter** (`@trpc/server/adapters/fetch`) para o API route handler em `app/api/trpc/[trpc]/route.ts`
- **`createTRPCOptionsProxy`** para prefetch em Server Components com hydration via `HydrationBoundary`
- **Server caller** (`appRouter.createCaller`) para acesso direto a dados em Server Components sem cache do React Query (útil para dados que não precisam de revalidação client-side)
- **`server-only`** e **`client-only`** para garantir que imports server/client não vazem entre ambientes
- **Helpers `HydrateClient` e `prefetch`** no `trpc/server.tsx` para simplificar o padrão de uso em pages

---

## Especificação da Implementação

### 1. Dependências

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only
```

### 2. Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts        # Fetch adapter (GET + POST)
│   └── layout.tsx                  # Montar TRPCReactProvider
├── trpc/
│   ├── init.ts                     # initTRPC, context, base procedure
│   ├── routers/
│   │   ├── _app.ts                 # Router principal (merge de sub-routers)
│   │   ├── roast.ts                # Procedures de roast (submit, getById, etc.)
│   │   └── leaderboard.ts          # Procedures do leaderboard
│   ├── client.tsx                  # Client hooks, provider, useTRPC
│   ├── query-client.ts             # Factory de QueryClient compartilhada
│   └── server.tsx                  # Server caller, prefetch helper, HydrateClient
```

### 3. `src/trpc/init.ts` — Inicialização do tRPC

```typescript
import { initTRPC } from '@trpc/server'
import { db } from '@/db'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    headers: opts.headers,
  }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
```

**Notas:**
- O context inclui a instância `db` do Drizzle para que procedures possam acessar o banco diretamente
- `headers` é incluído para possibilitar autenticação futura (mesmo que o app não tenha auth agora)
- Sem `superjson` — tipos nativos são suficientes

### 4. `src/trpc/routers/_app.ts` — Router Principal

```typescript
import { createTRPCRouter } from '../init'
import { roastRouter } from './roast'
import { leaderboardRouter } from './leaderboard'

export const appRouter = createTRPCRouter({
  roast: roastRouter,
  leaderboard: leaderboardRouter,
})

export type AppRouter = typeof appRouter
```

### 5. `src/trpc/routers/roast.ts` — Router de Roast

```typescript
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { roasts, roastIssues } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const roastRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const roast = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id))
        .limit(1)

      if (roast.length === 0) {
        return null
      }

      const issues = await ctx.db
        .select()
        .from(roastIssues)
        .where(eq(roastIssues.roastId, input.id))
        .orderBy(roastIssues.position)

      return {
        ...roast[0],
        issues,
      }
    }),

  submit: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(10000),
        language: z.enum([
          'javascript', 'typescript', 'sql', 'python',
          'go', 'rust', 'java', 'css', 'html', 'other',
        ]),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineCount = input.code.split('\n').length

      // TODO: chamar IA para análise do código
      // Por enquanto, placeholder para a estrutura

      const [newRoast] = await ctx.db
        .insert(roasts)
        .values({
          code: input.code,
          language: input.language,
          lineCount,
          roastMode: input.roastMode,
          score: 0, // placeholder
          verdict: 'mediocre', // placeholder
          roastQuote: 'placeholder', // placeholder
        })
        .returning()

      return newRoast
    }),
})
```

### 6. `src/trpc/routers/leaderboard.ts` — Router do Leaderboard

```typescript
import { z } from 'zod'
import { asc, count, avg } from 'drizzle-orm'
import { roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const leaderboardRouter = createTRPCRouter({
  getEntries: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }).optional(),
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
```

### 7. `src/trpc/query-client.ts` — Factory de QueryClient

```typescript
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query)
          || query.state.status === 'pending',
      },
    },
  })
}
```

**Notas:**
- `staleTime: 30s` evita refetch imediato no client após hydration do server
- `shouldDehydrateQuery` inclui queries pending para suportar streaming de promises via RSC

### 8. `src/trpc/client.tsx` — Client Provider e Hooks

```typescript
'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
  })()
  return `${base}/api/trpc`
}

export function TRPCReactProvider(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

### 9. `src/trpc/server.tsx` — Server Caller e Helpers

```typescript
import 'server-only'

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { TRPCQueryOptions } from '@trpc/tanstack-react-query'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { headers } from 'next/headers'
import { cache } from 'react'
import { createTRPCContext } from './init'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: async () =>
    createTRPCContext({
      headers: await headers(),
    }),
  router: appRouter,
  queryClient: getQueryClient,
})

export const caller = appRouter.createCaller(async () =>
  createTRPCContext({ headers: await headers() }),
)

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}
```

### 10. `src/app/api/trpc/[trpc]/route.ts` — API Route Handler

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/trpc/init'
import { appRouter } from '@/trpc/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
```

### 11. Modificação no `src/app/layout.tsx`

Envolver o children com `TRPCReactProvider`:

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { TRPCReactProvider } from '@/trpc/client'
import '@/styles/globals.css'

// ... Navbar e metadata permanecem iguais

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TRPCReactProvider>
          <Navbar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  )
}
```

### 12. Exemplo de Uso — Leaderboard Page (Server Component com Prefetch)

```typescript
// src/app/leaderboard/page.tsx
import type { Metadata } from 'next'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { LeaderboardContent } from './leaderboard-content'

export const metadata: Metadata = {
  title: 'shame leaderboard | devroast',
  description: 'the most roasted code on the internet, ranked by shame.',
}

export default function LeaderboardPage() {
  prefetch(trpc.leaderboard.getEntries.queryOptions({ limit: 10 }))
  prefetch(trpc.leaderboard.getStats.queryOptions())

  return (
    <HydrateClient>
      <LeaderboardContent />
    </HydrateClient>
  )
}
```

```typescript
// src/app/leaderboard/leaderboard-content.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'
import { LeaderboardEntry } from '@/components/ui/leaderboard-entry'

export function LeaderboardContent() {
  const trpc = useTRPC()
  const { data: entries } = useQuery(
    trpc.leaderboard.getEntries.queryOptions({ limit: 10 }),
  )
  const { data: stats } = useQuery(
    trpc.leaderboard.getStats.queryOptions(),
  )

  return (
    <main className="flex flex-col items-center px-10 pt-10 pb-10">
      {/* ... UI usando entries e stats */}
    </main>
  )
}
```

### 13. Exemplo de Uso — Roast Page (Server Caller direto)

Para a página de resultado de um roast, o `caller` é mais adequado porque os dados são estáticos (o roast já foi gerado):

```typescript
// src/app/roast/[id]/page.tsx
import { notFound } from 'next/navigation'
import { caller } from '@/trpc/server'

export default async function RoastPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const roast = await caller.roast.getById({ id })

  if (!roast) notFound()

  return (
    <main>
      {/* Renderizar resultado do roast com roast.score, roast.issues, etc. */}
    </main>
  )
}
```

### 14. Exemplo de Uso — Mutation (Submit Roast)

```typescript
// Em um client component
'use client'

import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

export function RoastForm() {
  const trpc = useTRPC()
  const submitRoast = useMutation(trpc.roast.submit.mutationOptions())

  const handleSubmit = () => {
    submitRoast.mutate({
      code: '...',
      language: 'javascript',
      roastMode: true,
    })
  }

  return <button onClick={handleSubmit}>$ roast_my_code</button>
}
```

---

## Tarefas de Implementacao

### Fase 1 — Infraestrutura tRPC

- [ ] Instalar dependencias: `pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only`
- [ ] Criar `src/trpc/init.ts` com `initTRPC`, `createTRPCContext`, `baseProcedure`
- [ ] Criar `src/trpc/query-client.ts` com factory de `QueryClient`
- [ ] Criar `src/trpc/client.tsx` com `TRPCReactProvider`, `useTRPC`
- [ ] Criar `src/trpc/server.tsx` com `trpc` proxy, `caller`, `HydrateClient`, `prefetch`
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` com fetch adapter

### Fase 2 — Routers e Procedures

- [ ] Criar `src/trpc/routers/roast.ts` com procedures `getById` e `submit`
- [ ] Criar `src/trpc/routers/leaderboard.ts` com procedures `getEntries` e `getStats`
- [ ] Criar `src/trpc/routers/_app.ts` mergeando os sub-routers

### Fase 3 — Integrar no App

- [ ] Modificar `src/app/layout.tsx` para envolver com `TRPCReactProvider`
- [ ] Refatorar `src/app/leaderboard/page.tsx` para usar prefetch + client component
- [ ] Refatorar `src/app/page.tsx` para buscar dados reais (leaderboard preview + stats)
- [ ] Refatorar `src/app/roast/[id]/page.tsx` para usar server caller
- [ ] Verificar que `pnpm lint` e `pnpm build` passam

---

## Questoes em Aberto

1. **Integração com IA no `roast.submit`**: A mutation de submit precisa chamar a IA para gerar score, verdict, roastQuote e issues. Essa integração será especificada em uma spec separada (provavelmente usando AI SDK ou OpenAI API).
2. **Autenticação futura**: O context já aceita `headers` para possibilitar middleware de auth. Se/quando adicionarmos auth, basta criar um middleware tRPC que valide o token nos headers.
3. **Rate limiting**: O endpoint de submit deve ter rate limiting para evitar abuso. Pode ser implementado como middleware tRPC ou no edge da Vercel.
4. **Serialização de Date**: O Drizzle retorna `Date` objects para campos `timestamp`. O tRPC sem `superjson` serializa como ISO string automaticamente via `JSON.stringify`. Verificar se isso é suficiente ou se `superjson` é necessário para round-trip correto.
