'use client'

import { Switch } from '@base-ui/react/switch'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

type ToggleProps = Omit<ComponentProps<typeof Switch.Root>, 'className'> & {
  label?: string
  className?: string
}

function Toggle({ label, className, ...props }: ToggleProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders a hidden input internally
    <label className={twMerge('inline-flex items-center gap-3 cursor-pointer', className)}>
      <Switch.Root
        className={twMerge(
          'relative inline-flex h-5.5 w-10 items-center rounded-full p-0.75',
          'transition-colors cursor-pointer',
          'bg-zinc-800 data-checked:bg-emerald-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        {...props}
      >
        <Switch.Thumb
          className={twMerge(
            'block size-4 rounded-full transition-transform',
            'bg-zinc-500 data-checked:bg-zinc-950',
            'translate-x-0 data-checked:translate-x-4.5',
          )}
        />
      </Switch.Root>
      {label && (
        <span
          className={twMerge(
            'font-mono text-xs transition-colors',
            'text-zinc-500 has-[+:checked]:text-emerald-500',
          )}
        >
          {label}
        </span>
      )}
    </label>
  )
}

export { Toggle, type ToggleProps }
