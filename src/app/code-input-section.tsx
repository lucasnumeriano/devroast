'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/ui/code-editor'
import { useToast } from '@/components/ui/toast'
import { Toggle } from '@/components/ui/toggle'
import { createRoast } from './actions'

export function CodeInputSection() {
  const [code, setCode] = useState('')
  const [roastMode, setRoastMode] = useState(true)
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [isOverLimit, setIsOverLimit] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  // Show toast from error query params (e.g. rate limit redirect)
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'rate_limit') {
      const retrySeconds = Number(searchParams.get('retry')) || 60
      const minutes = Math.ceil(retrySeconds / 60)
      const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`
      showToast({
        message: `rate limit exceeded. try again in ~${timeLabel}.`,
        type: 'error',
      })
      // Clean up URL without re-render
      router.replace('/', { scroll: false })
    }
  }, [searchParams, showToast, router])

  function handleSubmit() {
    startTransition(async () => {
      const result = await createRoast({
        code,
        language,
        roastMode,
      })

      if ('error' in result) {
        showToast({ message: result.error, type: 'error' })
        return
      }

      router.push(`/roast/${result.id}`)
    })
  }

  return (
    <>
      {/* Code Editor */}
      <section className="mt-8 w-full max-w-195">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          onLanguageChange={setLanguage}
          onOverLimit={setIsOverLimit}
        />
      </section>

      {/* Actions Bar */}
      <section className="mt-8 flex w-full max-w-195 items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle label="roast mode" checked={roastMode} onCheckedChange={setRoastMode} />
          <span className="font-sans text-xs text-zinc-600">{'// maximum sarcasm enabled'}</span>
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={code.trim().length === 0 || isOverLimit || isPending}
          onClick={handleSubmit}
        >
          {isPending ? '$ roasting...' : '$ roast_my_code'}
        </Button>
      </section>
    </>
  )
}
