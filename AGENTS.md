# devroast

AI-powered code roasting app. Users paste code, get brutally honest reviews with scores and improvement suggestions.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **tailwind-variants** (`tv`) + **tailwind-merge**
- **Biome** for linting/formatting
- **CodeMirror 6** for the code editor
- **Shiki** (vesper theme) for server-side syntax highlighting
- **@base-ui/react** for accessible primitives (Switch)

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
    layout.tsx      # Root layout with shared Navbar
    page.tsx        # Homepage (code input)
  components/
    ui/             # Reusable UI primitives (see ui/AGENTS.md)
  styles/
    globals.css     # Tailwind imports, fonts, base styles
```

## Conventions

- **Named exports only** — never use `export default` in `src/components/`.
- **Pages use `export default`** — Next.js App Router requires default exports for pages/layouts.
- **Biome enforced** — single quotes, no unnecessary semicolons, trailing commas, 2-space indent, 100 char line width. All code must pass `pnpm lint`.
- **Tailwind v4 syntax** — use short-form data attributes (`data-checked:` not `data-[checked]:`), use spacing tokens (`max-w-195` not `max-w-[780px]`). Only use arbitrary values when no token exists.
- **`@/*` path alias** — maps to `./src/*`.

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `accent-green` / emerald-500 | `#10B981` | Primary accent |
| `accent-red` / red-500 | `#EF4444` | Critical/danger |
| `accent-amber` / amber-500 | `#F59E0B` | Warnings, rank highlights |
| `bg-page` | `#0A0A0A` | Page background |
| `bg-input` | `#111111` | Code editor background |
| `border-primary` | `#2A2A2A` | All borders |
| `text-primary` | `#FAFAFA` | Main text |
| `text-secondary` | `#6B7280` | Subdued text |
| `text-tertiary` | `#4B5563` | Hints, stats |

## Fonts

- **JetBrains Mono** — primary mono font (`font-mono`)
- **IBM Plex Mono** — secondary font (`font-sans`), used for descriptions and hints

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Biome check |
| `pnpm format` | Biome format |

## Component Guidelines

See `src/components/ui/AGENTS.md` for detailed component creation patterns.
