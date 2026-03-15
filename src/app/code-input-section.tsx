'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/ui/code-editor'
import { Toggle } from '@/components/ui/toggle'

export function CodeInputSection() {
  const [code, setCode] = useState('')
  const [roastMode, setRoastMode] = useState(true)
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [isOverLimit, setIsOverLimit] = useState(false)

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
        <Button variant="primary" size="md" disabled={code.trim().length === 0 || isOverLimit}>
          $ roast_my_code
        </Button>
      </section>
    </>
  )
}
