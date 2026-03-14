import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const diffLineVariants = tv({
  base: 'flex gap-2 px-4 py-2 font-mono text-[13px]',
  variants: {
    type: {
      added: 'bg-[#0A1A0F]',
      removed: 'bg-[#1A0A0A]',
      context: 'bg-transparent',
    },
  },
  defaultVariants: {
    type: 'context',
  },
})

const prefixVariants = tv({
  base: 'select-none',
  variants: {
    type: {
      added: 'text-emerald-500',
      removed: 'text-red-500',
      context: 'text-zinc-600',
    },
  },
  defaultVariants: {
    type: 'context',
  },
})

const contentVariants = tv({
  base: '',
  variants: {
    type: {
      added: 'text-zinc-50',
      removed: 'text-zinc-500',
      context: 'text-zinc-500',
    },
  },
  defaultVariants: {
    type: 'context',
  },
})

type DiffLineVariants = VariantProps<typeof diffLineVariants>

type DiffLineProps = ComponentProps<'div'> &
  DiffLineVariants & {
    className?: string
  }

const prefixMap = {
  added: '+',
  removed: '-',
  context: ' ',
} as const

function DiffLine({ type, className, children, ...props }: DiffLineProps) {
  const resolvedType = type ?? 'context'

  return (
    <div className={twMerge(diffLineVariants({ type }), className)} {...props}>
      <span className={prefixVariants({ type })}>{prefixMap[resolvedType]}</span>
      <span className={contentVariants({ type })}>{children}</span>
    </div>
  )
}

export { DiffLine, type DiffLineProps, diffLineVariants }
