# UI Components - Creation Guidelines

Standards and patterns for creating components in this directory.

## Stack

- **React 19** with **TypeScript**
- **Tailwind CSS v4** for styling
- **tailwind-variants** (`tv`) for variant definitions
- **tailwind-merge** (`twMerge`) for className override support
- **Biome** for linting and formatting

## File Conventions

- One component per file.
- Use kebab-case for filenames (e.g. `date-picker.tsx`).

## Component Anatomy

Every component follows this structure, in this exact order:

```tsx
// 1. Imports
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

// 2. Variants definition with `tv`
const componentVariants = tv({
  base: [
    // base classes shared by all variants
  ],
  variants: {
    variant: { /* visual variants */ },
    size: { /* size variants */ },
  },
  defaultVariants: {
    variant: '...',
    size: '...',
  },
})

// 3. Types derived from variants + native HTML element props
type ComponentVariants = VariantProps<typeof componentVariants>

type ComponentProps = ComponentProps<'element'> &
  ComponentVariants & {
    className?: string
  }

// 4. Component as named function (NOT arrow function, NOT default export)
function Component({ variant, size, className, ...props }: ComponentProps) {
  return (
    <element
      className={twMerge(componentVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// 5. Named exports only
export { Component, componentVariants, type ComponentProps }
```

## Rules

### Exports

- **Always** use named exports (`export { Component }`).
- **Never** use default exports.
- Export three things: the component, the variants function, and the props type.

### TypeScript

- Extend native HTML element props using `ComponentProps<'element'>` from React.
- Use `type` keyword for type aliases (not `interface` for union types).
- Derive variant types with `VariantProps<typeof variants>` instead of duplicating them manually.
- Import types with `import type` when the import is only used at the type level.

### Variants (tailwind-variants)

- Define variants using the `tv()` function from `tailwind-variants`.
- Use arrays for multi-line class lists in `base` and variant values for readability.
- Always define `defaultVariants` so the component works without any props.
- Common variant axes:
  - `variant` for visual style (primary, secondary, ghost, destructive, etc.)
  - `size` for dimensions (sm, md, lg)
- Use `compoundVariants` when a combination of variants needs specific overrides.

### Styling

- Use `twMerge()` wrapping the `tv()` output + `className` prop so consumers can override styles.
- Follow the project's design tokens (emerald for primary accent, zinc scale for neutrals).
- Include `disabled:` states in `base` classes.
- Include `hover:` transitions in each variant.
- Use `transition-colors` or similar for smooth state changes.
- Apply `cursor-pointer` on interactive elements.

### Component Function

- Use regular function declarations (`function Component`), not arrow functions.
- Destructure variant props and `className` from props, spread the rest onto the native element.
- Keep components simple and presentational — no internal state or side effects unless strictly necessary.

## Biome — Linting & Formatting

All code must pass `biome check` before being considered done. Below are the active rules.

### Formatting

| Rule | Value |
|---|---|
| Indent style | spaces |
| Indent width | 2 |
| Line width | 100 characters |
| Quote style | single quotes (`'`) |
| Semicolons | only when necessary (asNeeded) |
| Trailing commas | always |
| Arrow parentheses | always (`(x) => ...`, never `x => ...`) |

### Linting

- Uses the **recommended** ruleset.
- CSS linting is enabled.
- Custom rule: `noUnknownAtRules` ignores Tailwind-specific at-rules (`@theme`, `@apply`, `@variant`, `@screen`, `@utility`, `@source`, `@custom-variant`, `@plugin`).

### Common Mistakes to Avoid

- **Double quotes**: always use single quotes in JS/TS (`'value'`, not `"value"`).
- **Unnecessary semicolons**: omit them unless required for disambiguation.
- **Missing trailing commas**: always add trailing commas in multi-line arrays, objects, parameters, and arguments.
- **Lines over 100 characters**: break long lines. Use arrays in `tv()` base/variants for readability.
- **Arrow functions without parentheses**: always wrap the parameter — `(x) => x`, not `x => x`.
- **Unused imports**: remove them. Biome's recommended rules flag unused imports as errors.
- **Default exports**: not used in this directory. Always use named exports.

## Tailwind v4 — Class Syntax

Tailwind v4 introduced shorter syntax for data attribute variants and spacing utilities. Always prefer the modern forms.

### Data attribute variants

Use the short form `data-<name>:` instead of the bracket syntax `data-[<name>]:`.

| Correct | Incorrect |
|---|---|
| `data-checked:bg-emerald-500` | `data-[checked]:bg-emerald-500` |
| `data-disabled:opacity-50` | `data-[disabled]:opacity-50` |
| `data-open:rotate-180` | `data-[open]:rotate-180` |

The bracket form `data-[...]` is only needed for attributes with values (e.g. `data-[state=open]:flex`).

### Spacing utilities

Use Tailwind's spacing scale values instead of arbitrary values in brackets when an equivalent exists.

| Correct | Incorrect |
|---|---|
| `h-5.5` | `h-[22px]` |
| `p-0.75` | `p-[3px]` |
| `translate-x-4.5` | `translate-x-[18px]` |
| `gap-2.5` | `gap-[10px]` |
| `p-3.5` | `p-[14px]` |

Only use arbitrary values (`[Npx]`) when there is no matching spacing token.
