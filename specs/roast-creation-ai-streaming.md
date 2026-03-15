# Roast Creation with AI Streaming

## Resumo

Feature principal do devroast: o usuario cola codigo, submete para analise, e ve o resultado gerado pela IA sendo streamado progressivamente na pagina de resultado. Usa Gemini 2.0 Flash via Vercel AI SDK v5 com `streamText` + `Output.object()`.

## Decisao Arquitetural

- **Server Action + API Route split**: Server Actions nao suportam streaming de respostas, entao a criacao do roast (validacao, rate limiting, insert no DB) fica numa Server Action, e o streaming da IA fica numa API Route separada.
- **`streamText` + `Output.object()`** em vez de `streamObject` (deprecated no AI SDK v5+).
- **`useObject`** no client para consumir o stream e renderizar progressivamente.
- **Rate limiting via DB** (5/hora por IP) — simples, sem dependencias externas.
- **Toast customizado** com `@base-ui/react` para erros na homepage.
- **Sem share roast** nesta iteracao.

## User Flow

1. Usuario digita/cola codigo no CodeMirror editor na homepage
2. Opcionalmente alterna roast mode (ON por padrao) e seleciona linguagem (auto-detectada por padrao)
3. Clica `$ roast_my_code`
4. Server Action valida input e aplica rate limiting (5 roasts/hora por IP)
5. Server Action cria um registro `pending` no DB, retorna `{ id }`
6. Client navega para `/roast/[id]`
7. Page detecta `status === 'pending'`, renderiza `RoastStreamView` (client component)
8. `RoastStreamView` chama `submit()` do `useObject` (via `useEffect` no mount) para POST em `/api/roast/[id]/stream`
9. API Route chama Gemini 2.0 Flash via `streamText` com `Output.object()` (Vercel AI SDK v5)
10. Resultados parciais streamam progressivamente: score, verdict, roastQuote, issues (um por um), suggestedDiff
11. No `onFinish`, API Route salva o resultado completo no DB e marca `status: 'completed'`
12. Se o usuario recarregar a pagina depois, o roast carrega do DB pela rota server-side existente

## Fora de Escopo

- Funcionalidade de share roast
- Autenticacao / contas de usuario
- Edicao ou exclusao de roasts

---

## Especificacao da Implementacao

### Database Changes

#### Extend enum: `language`

O `languageEnum` atual tem 10 valores mas o editor suporta 20. Estender para incluir todas as linguagens do editor:

Atual: `javascript`, `typescript`, `sql`, `python`, `go`, `rust`, `java`, `css`, `html`, `other`

Adicionar: `c`, `cpp`, `cs`, `php`, `json`, `markdown`, `yaml`, `shell`, `ruby`, `kotlin`, `swift`

#### Novo enum: `roast_status`

Valores: `'pending'`, `'completed'`, `'failed'`

#### Tabela modificada: `roasts`

| Mudanca | Detalhes |
|---|---|
| Add column `status` | `roast_status` enum, `notNull()`, default `'pending'` |
| Add column `ip` | `text`, nullable. Armazena IP do client para rate limiting |
| Make `score` nullable | Era `real notNull()`, vira `real` (nullable) |
| Make `verdict` nullable | Era `verdict enum notNull()`, vira nullable |
| Make `roast_quote` nullable | Era `text notNull()`, vira nullable |

As colunas `code`, `language`, `lineCount` e `roastMode` permanecem `notNull` — sao definidas na criacao. As colunas de resultado (`score`, `verdict`, `roastQuote`, `suggestedDiff`, `diffFileName`) ficam null enquanto o status e `pending` e sao populadas quando o stream completa.

#### Sem mudancas em `roast_issues`

Issues sao inseridas em batch apos o stream completar, como antes.

### Shared Schema

**Arquivo:** `src/lib/roast-schema.ts`

Schema Zod compartilhado entre a API Route (para `Output.object()`) e o client (para `useObject`):

```typescript
import { z } from 'zod'

export const roastResultSchema = z.object({
  score: z.number().min(0).max(10).describe('Code quality score from 0.0 (terrible) to 10.0 (perfect)'),
  verdict: z.enum(['needs_serious_help', 'bad', 'mediocre', 'decent', 'clean_code']),
  roastQuote: z.string().describe('A short, memorable phrase summarizing the review (max ~150 chars)'),
  issues: z.array(z.object({
    severity: z.enum(['critical', 'warning', 'good']),
    title: z.string(),
    description: z.string(),
  })).describe('List of issues found, from most severe to least. Include positive points with severity "good" if applicable'),
  suggestedDiff: z.string().optional().describe('Unified diff showing the most important fix, if relevant'),
  diffFileName: z.string().optional().describe('Suggested filename for the diff'),
})
```

### Server Action: `createRoast`

**Arquivo:** `src/app/actions.ts` (deve ter `'use server'` no topo)

**Validacao de input (Zod):**
- `code`: string, min 1, max 5000
- `language`: um dos valores do `languageEnum` (default: `'other'` se omitido)
- `roastMode`: boolean

**Extracao de IP:**

No Next.js 16, `headers()` de `next/headers` e async:

```typescript
import { headers } from 'next/headers'

const headersList = await headers()
const forwardedFor = headersList.get('x-forwarded-for')
const ip = forwardedFor?.split(',')[0]?.trim()
  ?? headersList.get('x-real-ip')
  ?? 'unknown'
```

**Rate limiting:**
```sql
SELECT COUNT(*) FROM roasts
WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 hour' AND status != 'failed'
```
Se count >= 5, retornar `{ error: 'rate limit exceeded. try again later.' }`.

**Em sucesso:**
1. Calcular `lineCount` com `code.split('\n').length`
2. Inserir em `roasts` com `status: 'pending'`, `code`, `language`, `lineCount`, `roastMode`, `ip`
3. Retornar `{ id }`

**Em erro:**
- Falha de validacao: retornar `{ error: 'invalid input' }`
- Rate limit: retornar `{ error: 'rate limit exceeded. try again later.' }`
- Erro de DB: retornar `{ error: 'something went wrong' }`

### API Route: Streaming

**Arquivo:** `src/app/api/roast/[id]/stream/route.ts`

**Metodo:** `POST` (requerido pelo `useObject` — seu `submit()` envia um POST)

**Flow:**
1. Buscar roast por `id` no DB
2. Se nao encontrado: retornar 404
3. Se `status !== 'pending'`: retornar 409 (ja processado)
4. Chamar `streamText` do pacote `ai` com `Output.object()`:
   - Model: `google('gemini-2.0-flash')` via `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })`
   - System prompt (ver secao de Prompt)
   - User prompt com o codigo
   - `output: Output.object({ schema: roastResultSchema })`
   - Temperature baseada em `roastMode`
5. Retornar o stream como response via `result.toTextStreamResponse()`
6. No callback `onFinish`:
   - Usar `WHERE id = $1 AND status = 'pending'` para prevenir escritas duplicadas
   - Atualizar registro do roast: setar `score`, `verdict`, `roastQuote`, `suggestedDiff`, `diffFileName`, `status: 'completed'`
   - Inserir linhas em `roast_issues` com `position` correspondendo ao indice do array
7. Em erro: atualizar `status` do roast para `'failed'`

**Timeout:** Definir `export const maxDuration = 60` na API Route para permitir ate 60 segundos para o stream da IA.

### AI Prompt

#### System prompt (base)

```
You are a brutally honest code reviewer. Analyze the provided code and return a structured evaluation.

Rules:
- score: 0.0 to 10.0 where 0 is terrible code and 10 is perfect
- verdict: based on score (0-2: needs_serious_help, 2-4: bad, 4-6: mediocre, 6-8: decent, 8-10: clean_code)
- roastQuote: a short, memorable phrase summarizing the evaluation (max ~150 chars)
- issues: list problems found, from most severe to least. Include positive points with severity "good" if any exist
- suggestedDiff: if relevant, provide a unified diff showing the most important correction. Omit if not applicable.
- diffFileName: suggested filename for the diff

Always respond in English.
```

#### Roast mode addition

Quando `roastMode: true`, append ao system prompt:

```
ROAST MODE ACTIVATED: Be maximum sarcastic and funny.
The roastQuote should be a memorable joke/burn about the code.
Issue descriptions should have acid humor.
Keep the technical analysis accurate, but with a stand-up comedy tone roasting the code.
```

#### User prompt

```
Language: {language}

Code:
```{language}
{code}
```
```

#### Temperature

- `roastMode: true`: `0.8`
- `roastMode: false`: `0.3`

### Client Components

#### CodeInputSection changes

**Arquivo:** `src/app/code-input-section.tsx`

Adicionar:
- `isPending` state via `useTransition`
- `onClick` handler no botao:
  1. Chamar `createRoast({ code, language: language ?? 'other', roastMode })` via Server Action
  2. Se sucesso, `router.push('/roast/${result.id}')`
  3. Se erro, mostrar toast de erro com a mensagem
- Enquanto `isPending`, botao mostra estado de loading (disabled + texto muda para `$ roasting...`)

#### RoastStreamView

**Arquivo:** `src/app/roast/[id]/roast-stream-view.tsx`

Client component (`'use client'`). Recebe `roastId` e `roastMode` como props.

Usa `experimental_useObject as useObject` de `@ai-sdk/react`:

```typescript
import { experimental_useObject as useObject } from '@ai-sdk/react'

const { object, isLoading, error, submit } = useObject({
  api: `/api/roast/${roastId}/stream`,
  schema: roastResultSchema,
})

// Trigger the stream on mount
useEffect(() => {
  submit(undefined)
}, [])
```

**Importante:** `useObject` NAO faz auto-fetch. `submit()` deve ser chamado explicitamente (aqui via `useEffect` no mount) para iniciar a conexao de streaming.

Renderiza progressivamente conforme o `object` parcial chega:
- `ScoreRing`: renderiza com `object.score ?? 0`, anima conforme o score real chega
- `Badge`: aparece quando `object.verdict` esta definido
- `roastQuote`: renderiza `object.roastQuote` conforme streama (texto cresce caractere por caractere naturalmente dos objetos parciais)
- Issues: renderiza `object.issues?.map(...)` — cards aparecem um por um conforme o array cresce
- Diff: renderiza quando `object.suggestedDiff` esta definido

Quando `isLoading` vira false e sem erro, chama `router.refresh()` para revalidar dados do servidor.

Se `error`, mostra estado de erro.

#### RoastErrorView

**Arquivo:** `src/app/roast/[id]/roast-error-view.tsx`

Componente simples mostrado quando `status === 'failed'`. Exibe:
- Mensagem de erro: `// something went wrong while roasting your code`
- Botao para voltar a homepage: `$ try_again`

#### Toast Component

**Arquivo:** `src/components/ui/toast.tsx`

Componente de toast minimalista construido com `@base-ui/react`:
- Renderiza no canto inferior-direito do viewport
- Auto-dismiss apos ~5 segundos
- Suporta estilo de erro (borda com accent vermelho)
- Expoe via hook `useToast` ou context provider
- Segue os padroes de componente existentes (named exports, `tv()`, `twMerge`)

#### Page routing logic

**Arquivo:** `src/app/roast/[id]/page.tsx`

O componente async `RoastResultContent` existente adiciona check de status:

```
status === 'completed' -> render UI de resultado existente (server-side, sem mudancas)
status === 'pending'   -> render <RoastStreamView roastId={id} roastMode={roast.roastMode} />
status === 'failed'    -> render <RoastErrorView />
```

**Handling de tipos nullable:** Apos o check `status === 'completed'`, os campos de resultado (`score`, `verdict`, `roastQuote`) sao garantidamente non-null. Usar type narrowing (guard function ou assertion) para que os tipos TypeScript do `RoastResultContent` existente nao quebrem.

O botao de share existente permanece como placeholder nao-funcional.

A estrutura externa da pagina (Suspense wrapper, skeleton) permanece a mesma.

### Rate Limiting

Abordagem simples baseada em DB, sem dependencias externas.

- **Limite:** 5 roasts por IP por hora
- **Ponto de enforcement:** Server Action (`createRoast`), antes de inserir o registro
- **Fonte do IP:** header `x-forwarded-for` (primeiro IP) ou `x-real-ip`, fallback `'unknown'`
- **Query:** contar roasts com IP correspondente criados na ultima hora
- **Armazenado em:** coluna `roasts.ip` (text nullable)

### New Dependencies

```bash
pnpm add ai@^5 @ai-sdk/react@^5 @ai-sdk/google
```

**Compatibilidade Zod v4:** O projeto usa `zod@^4.3.6`. AI SDK v5 tem suporte interno para Zod v4 — nenhum compat layer e necessario.

### Environment Variables

| Variavel | Descricao |
|---|---|
| `GEMINI_API_KEY` | Chave da API Gemini. Requerida para geracao de roasts. Passada explicitamente via `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })`. |

Adicionar a `.env.example`.

---

## Tarefas de Implementacao

### Fase 1: Database & Schema

- [ ] Estender `languageEnum` no schema com as 11 linguagens faltantes
- [ ] Adicionar `roastStatusEnum` ao schema
- [ ] Adicionar colunas `status` e `ip` na tabela `roasts`
- [ ] Tornar `score`, `verdict`, `roastQuote` nullable
- [ ] Gerar e aplicar migracao Drizzle
- [ ] Atualizar seed se necessario para compatibilidade

### Fase 2: Shared Schema & AI Config

- [ ] Criar `src/lib/roast-schema.ts` com schema Zod compartilhado
- [ ] Instalar dependencias: `ai@^5`, `@ai-sdk/react@^5`, `@ai-sdk/google`
- [ ] Adicionar `GEMINI_API_KEY` ao `.env.example`

### Fase 3: Server Action

- [ ] Criar `src/app/actions.ts` com `createRoast`
- [ ] Implementar validacao de input com Zod
- [ ] Implementar extracao de IP
- [ ] Implementar rate limiting via query no DB
- [ ] Implementar insert do roast pending

### Fase 4: API Route

- [ ] Criar `src/app/api/roast/[id]/stream/route.ts`
- [ ] Implementar lookup do roast e guards (404, 409)
- [ ] Implementar `streamText` + `Output.object()` com Gemini 2.0 Flash
- [ ] Implementar system/user prompts com variacao de roast mode
- [ ] Implementar `onFinish` para salvar resultado no DB
- [ ] Implementar error handling (marcar como `failed`)

### Fase 5: Client Components

- [ ] Criar `src/components/ui/toast.tsx` (toast component + hook/provider)
- [ ] Atualizar `src/app/code-input-section.tsx` com submit handler, loading state, toast de erro
- [ ] Criar `src/app/roast/[id]/roast-stream-view.tsx`
- [ ] Criar `src/app/roast/[id]/roast-error-view.tsx`
- [ ] Atualizar `src/app/roast/[id]/page.tsx` com routing baseado em status

### Fase 6: Type Updates

- [ ] Atualizar `src/trpc/routers/roast.ts` para incluir `status` e lidar com campos nullable
- [ ] Verificar que tipos TypeScript nao quebram na pagina de resultado existente

## File Changes Summary

| Arquivo | Mudanca |
|---|---|
| `src/db/schema.ts` | Estender `languageEnum`, add `roastStatusEnum`, colunas `status`/`ip`, campos de resultado nullable |
| `src/trpc/routers/roast.ts` | Atualizar `getById` para incluir `status`; tipos mudam por campos nullable |
| `src/lib/roast-schema.ts` | **Novo** — schema Zod compartilhado para output estruturado da IA |
| `src/app/actions.ts` | **Novo** — Server Action `createRoast` |
| `src/app/api/roast/[id]/stream/route.ts` | **Novo** — API Route de streaming |
| `src/app/code-input-section.tsx` | Add submit handler, loading state, toast de erro |
| `src/app/roast/[id]/page.tsx` | Add routing baseado em status (completed/pending/failed) |
| `src/app/roast/[id]/roast-stream-view.tsx` | **Novo** — client component consumindo o stream da IA |
| `src/app/roast/[id]/roast-error-view.tsx` | **Novo** — componente de estado de erro |
| `src/components/ui/toast.tsx` | **Novo** — componente de toast notification |
| `.env.example` | Add `GEMINI_API_KEY` |
| DB migration | Nova migracao para mudancas no schema |

## Error Handling Summary

| Cenario | Comportamento |
|---|---|
| Codigo vazio / acima do limite | Botao desabilitado (existente) |
| Falha de validacao na Server Action | Toast de erro na homepage |
| Rate limit excedido | Toast: "rate limit exceeded. try again later." |
| Erro de DB ao criar | Toast: "something went wrong" |
| Stream da IA falha no meio | Roast marcado `failed`, error view mostrada |
| Usuario recarrega roast pendente | POST retorna 409. `RoastStreamView` captura 409, espera 2s, chama `router.refresh()` para pegar resultado completo. Se ja completou: carrega do DB. Se falhou: mostra error view |
| Usuario visita roast com falha | Error view com botao "try again" |
| API Route chamada para roast completo | Retorna 409, client faz fallback para dados do DB |
| Race condition na escrita do DB | `onFinish` usa `WHERE status = 'pending'` para prevenir escritas duplicadas |
| Stream da IA trava | `maxDuration = 60` na API Route mata a request apos 60s |
