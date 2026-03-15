'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/ui/code-editor'
import { Toggle } from '@/components/ui/toggle'

const leaderboardData = [
  {
    rank: 1,
    score: '1.2',
    code: ['eval(prompt("enter code"))', 'document.write(response)', '// trust the user lol'],
    lang: 'javascript',
    highlight: true,
  },
  {
    rank: 2,
    score: '1.8',
    code: [
      'if (x == true) { return true; }',
      'else if (x == false) { return false; }',
      'else { return !false; }',
    ],
    lang: 'typescript',
    highlight: false,
  },
  {
    rank: 3,
    score: '2.1',
    code: ['SELECT * FROM users WHERE 1=1', '-- TODO: add authentication'],
    lang: 'sql',
    highlight: false,
  },
]

export default function Home() {
  const [code, setCode] = useState('')
  const [roastMode, setRoastMode] = useState(true)
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [isOverLimit, setIsOverLimit] = useState(false)

  return (
    <main className="flex flex-col items-center px-10 pt-20 pb-0">
      {/* Hero */}
      <section className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-4xl font-bold text-emerald-500">$</span>
          <h1 className="font-mono text-4xl font-bold text-zinc-50">
            paste your code. get roasted.
          </h1>
        </div>
        <p className="font-sans text-sm text-zinc-600">
          {"// drop your code below and we'll rate it \u2014 brutally honest or full roast mode"}
        </p>
      </section>

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

      {/* Footer Stats */}
      <section className="mt-8 flex items-center justify-center gap-6">
        <span className="font-sans text-xs text-zinc-600">2,847 codes roasted</span>
        <span className="font-mono text-xs text-zinc-600">&middot;</span>
        <span className="font-sans text-xs text-zinc-600">avg score: 4.2/10</span>
      </section>

      {/* Spacer */}
      <div className="h-15" />

      {/* Leaderboard Preview */}
      <section className="w-full max-w-240 space-y-6">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-emerald-500">{'//'}</span>
            <span className="font-mono text-sm font-bold text-zinc-50">shame_leaderboard</span>
          </div>
          <Button variant="ghost" size="sm">
            $ view_all {'>>'}
          </Button>
        </div>

        {/* Subtitle */}
        <p className="font-sans text-sm text-zinc-600">
          {'// the worst code on the internet, ranked by shame'}
        </p>

        {/* Table */}
        <div className="overflow-hidden border border-zinc-800">
          {/* Header */}
          <div className="flex h-10 items-center bg-zinc-900/50 px-5">
            <span className="w-12.5 font-mono text-xs font-medium text-zinc-600">#</span>
            <span className="w-17.5 font-mono text-xs font-medium text-zinc-600">score</span>
            <span className="flex-1 font-mono text-xs font-medium text-zinc-600">code</span>
            <span className="w-25 font-mono text-xs font-medium text-zinc-600">lang</span>
          </div>

          {/* Rows */}
          {leaderboardData.map((row, index) => (
            <div
              key={row.rank}
              className={`flex items-start px-5 py-4 ${
                index < leaderboardData.length - 1 ? 'border-b border-zinc-800' : ''
              }`}
            >
              <span
                className={`w-12.5 font-mono text-xs ${
                  row.highlight ? 'text-amber-500' : 'text-zinc-500'
                }`}
              >
                {row.rank}
              </span>
              <span className="w-17.5 font-mono text-xs font-bold text-red-500">{row.score}</span>
              <div className="flex flex-1 flex-col gap-0.75">
                {row.code.map((line) => (
                  <span
                    key={line}
                    className={`font-mono text-xs ${
                      line.startsWith('//') || line.startsWith('--')
                        ? 'text-zinc-500'
                        : 'text-zinc-50'
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </div>
              <span className="w-25 font-mono text-xs text-zinc-500">{row.lang}</span>
            </div>
          ))}
        </div>

        {/* Fade Hint */}
        <div className="flex justify-center py-4">
          <span className="font-sans text-xs text-zinc-600">
            {'showing top 3 of 2,847 \u00b7 '}
          </span>
          <Link
            href="/leaderboard"
            className="font-sans text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {'view full leaderboard >>'}
          </Link>
        </div>
      </section>

      {/* Bottom Spacer */}
      <div className="h-15" />
    </main>
  )
}
