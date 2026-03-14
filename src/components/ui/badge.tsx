import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const badgeVariants = tv({
  base: 'inline-flex items-center gap-2 font-mono text-xs',
  variants: {
    status: {
      critical: 'text-red-500',
      warning: 'text-amber-500',
      good: 'text-emerald-500',
    },
  },
  defaultVariants: {
    status: 'good',
  },
})

const dotVariants = tv({
  base: 'size-2 rounded-full',
  variants: {
    status: {
      critical: 'bg-red-500',
      warning: 'bg-amber-500',
      good: 'bg-emerald-500',
    },
  },
  defaultVariants: {
    status: 'good',
  },
})

type BadgeVariants = VariantProps<typeof badgeVariants>

type BadgeProps = ComponentProps<'span'> &
  BadgeVariants & {
    className?: string
  }

function Badge({ status, className, children, ...props }: BadgeProps) {
  return (
    <span className={twMerge(badgeVariants({ status }), className)} {...props}>
      <span className={dotVariants({ status })} />
      {children}
    </span>
  )
}

export { Badge, type BadgeProps, badgeVariants }
