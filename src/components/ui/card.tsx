import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

type CardProps = ComponentProps<'div'> & {
  className?: string
}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={twMerge('flex flex-col gap-3 border border-zinc-800 p-5', className)}
      {...props}
    />
  )
}

type CardHeaderProps = ComponentProps<'div'> & {
  className?: string
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={twMerge('flex items-center gap-2', className)} {...props} />
}

type CardTitleProps = ComponentProps<'p'> & {
  className?: string
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <p className={twMerge('font-mono text-sm text-zinc-50', className)} {...props} />
}

type CardDescriptionProps = ComponentProps<'p'> & {
  className?: string
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={twMerge('font-[IBM_Plex_Mono] text-xs leading-relaxed text-zinc-500', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardDescription,
  type CardDescriptionProps,
  CardHeader,
  type CardHeaderProps,
  type CardProps,
  CardTitle,
  type CardTitleProps,
}
