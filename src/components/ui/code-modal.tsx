'use client'

import { Dialog } from '@base-ui/react/dialog'
import { twMerge } from 'tailwind-merge'

type CodeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  html: string | null
  language: string
  lineCount: number
  loading: boolean
}

function CodeModalSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <span className="inline-block h-3.5 w-4/5 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-3/5 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-2/3 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-1/2 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-3/4 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-2/5 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-3/5 animate-pulse rounded bg-zinc-800/60" />
      <span className="inline-block h-3.5 w-4/5 animate-pulse rounded bg-zinc-800/60" />
    </div>
  )
}

function CodeModal({ open, onOpenChange, html, language, lineCount, loading }: CodeModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={twMerge(
            'fixed inset-0 bg-black/60',
            'transition-opacity duration-200',
            'data-starting-style:opacity-0 data-ending-style:opacity-0',
          )}
        />
        <Dialog.Popup
          className={twMerge(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex h-[90dvh] w-full max-w-240 flex-col',
            'border border-zinc-800 bg-[#111111]',
            'transition-all duration-200',
            'data-starting-style:scale-95 data-starting-style:opacity-0',
            'data-ending-style:scale-95 data-ending-style:opacity-0',
          )}
        >
          {/* Header */}
          <div
            className={twMerge(
              'flex h-12 shrink-0 items-center justify-between',
              'border-b border-zinc-800 bg-[#0A0A0A] px-5',
            )}
          >
            <div className="flex items-center gap-3">
              <Dialog.Title className="font-mono text-xs text-zinc-400">{language}</Dialog.Title>
              <span className="font-mono text-xs text-zinc-600">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <Dialog.Close
              className={twMerge(
                'flex size-7 items-center justify-center rounded',
                'font-mono text-sm text-zinc-500',
                'transition-colors hover:bg-zinc-800 hover:text-zinc-300',
                'cursor-pointer',
              )}
            >
              &times;
            </Dialog.Close>
          </div>

          {/* Code Area */}
          <div
            className={twMerge(
              'min-h-0 flex-1 overflow-y-auto',
              '[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px]',
              '[&_pre]:leading-relaxed [&_code]:font-mono',
              '[&_.line]:before:mr-6 [&_.line]:before:inline-block',
              '[&_.line]:before:w-4 [&_.line]:before:text-right [&_.line]:before:text-zinc-600',
              '[&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line]',
              '[&_pre]:[counter-reset:line]',
            )}
          >
            {loading ? (
              <CodeModalSkeleton />
            ) : html ? (
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is trusted server-side HTML
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-mono text-sm text-zinc-600">{'// code not found'}</span>
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { CodeModal, type CodeModalProps }
