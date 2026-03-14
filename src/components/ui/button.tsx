import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center gap-2',
    'font-mono cursor-pointer transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary: 'bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400',
      danger: 'bg-red-500 text-zinc-50 font-medium hover:bg-red-400',
      secondary: ['bg-transparent text-zinc-50 border border-zinc-800', 'hover:bg-zinc-800/50'],
      ghost: [
        'bg-transparent text-zinc-500 border border-zinc-800',
        'hover:text-zinc-300 hover:bg-zinc-800/30',
      ],
    },
    size: {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-xs',
      lg: 'px-6 py-2.5 text-sm',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

type ButtonVariants = VariantProps<typeof buttonVariants>

type ButtonProps = ComponentProps<'button'> &
  ButtonVariants & {
    className?: string
  }

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={twMerge(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, type ButtonProps, buttonVariants }
