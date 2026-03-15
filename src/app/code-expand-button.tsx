'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CodeModal } from '@/components/ui/code-modal'
import { useTRPC } from '@/trpc/client'

type CodeExpandButtonProps = {
  roastId: string
  language: string
  lineCount: number
}

function CodeExpandButton({ roastId, language, lineCount }: CodeExpandButtonProps) {
  const [open, setOpen] = useState(false)
  const trpc = useTRPC()

  const { data, isLoading } = useQuery(
    trpc.roast.getHighlightedCode.queryOptions({ id: roastId }, { enabled: open }),
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'flex h-8 w-full cursor-pointer items-center justify-center',
          'border border-t-0 border-zinc-800 bg-zinc-900',
          'font-mono text-xs text-zinc-500',
          'transition-colors hover:bg-zinc-800 hover:text-zinc-300',
        ].join(' ')}
      >
        $ expand {'>>'}
      </button>

      <CodeModal
        open={open}
        onOpenChange={setOpen}
        html={data?.html ?? null}
        language={language}
        lineCount={lineCount}
        loading={isLoading}
      />
    </>
  )
}

export { CodeExpandButton, type CodeExpandButtonProps }
