'use client'

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, placeholder } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import flourite from 'flourite'
import { useCallback, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { getLanguageById, LANGUAGES } from '@/lib/languages'

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#FFFFFF', fontWeight: 'bold' },
  { tag: tags.operator, color: '#FFFFFF' },
  { tag: tags.special(tags.variableName), color: '#A8B1FF' },
  { tag: tags.typeName, color: '#FFC799' },
  { tag: tags.atom, color: '#FF8080' },
  { tag: tags.bool, color: '#FF8080' },
  { tag: tags.number, color: '#FF8080' },
  { tag: tags.string, color: '#99FFE4' },
  { tag: tags.regexp, color: '#99FFE4' },
  { tag: tags.escape, color: '#FFC799' },
  { tag: tags.comment, color: '#5A5A5A', fontStyle: 'italic' },
  { tag: tags.definition(tags.variableName), color: '#A8B1FF' },
  { tag: tags.definition(tags.propertyName), color: '#A8B1FF' },
  { tag: tags.function(tags.variableName), color: '#A8B1FF' },
  { tag: tags.variableName, color: '#D4D4D4' },
  { tag: tags.propertyName, color: '#D4D4D4' },
  { tag: tags.className, color: '#FFC799' },
  { tag: tags.labelName, color: '#FFC799' },
  { tag: tags.namespace, color: '#FFC799' },
  { tag: tags.macroName, color: '#A8B1FF' },
  { tag: tags.meta, color: '#5A5A5A' },
  { tag: tags.invalid, color: '#EF4444' },
  { tag: tags.link, color: '#99FFE4', textDecoration: 'underline' },
  { tag: tags.heading, color: '#FFFFFF', fontWeight: 'bold' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
])

const editorTheme = EditorView.theme(
  {
    '&': {
      fontSize: '12px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      overflow: 'auto',
    },
    '.cm-content': {
      caretColor: '#10B981',
      padding: '16px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#10B981',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#10B98133',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      backgroundColor: '#0F0F0F',
      color: '#4B5563',
      border: 'none',
      borderRight: '1px solid #2A2A2A',
      minWidth: '48px',
    },
    '.cm-gutterElement': {
      padding: '0 12px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-placeholder': {
      color: '#4B5563',
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontStyle: 'normal',
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  },
  { dark: true },
)

type CodeEditorProps = {
  value?: string
  onChange?: (value: string) => void
  language?: string
  onLanguageChange?: (lang: string | undefined) => void
  className?: string
}

function CodeEditor({
  value = '',
  onChange,
  language,
  onLanguageChange,
  className,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onLanguageChangeRef = useRef(onLanguageChange)
  const initialValueRef = useRef(value)
  const languageCompartmentRef = useRef(new Compartment())
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentLanguageRef = useRef<string | null>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState<string>('plaintext')
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  onChangeRef.current = onChange
  onLanguageChangeRef.current = onLanguageChange

  const applyLanguage = useCallback(async (langId: string) => {
    const view = viewRef.current
    if (!view || langId === currentLanguageRef.current) return

    const langDef = getLanguageById(langId)
    if (!langDef) {
      view.dispatch({
        effects: languageCompartmentRef.current.reconfigure([]),
      })
      currentLanguageRef.current = null
      return
    }

    try {
      const extension = await langDef.codemirror()
      view.dispatch({
        effects: languageCompartmentRef.current.reconfigure(extension),
      })
      currentLanguageRef.current = langId
    } catch {
      view.dispatch({
        effects: languageCompartmentRef.current.reconfigure([]),
      })
      currentLanguageRef.current = null
    }
  }, [])

  const clearLanguage = useCallback(() => {
    const view = viewRef.current
    if (view && currentLanguageRef.current !== null) {
      view.dispatch({
        effects: languageCompartmentRef.current.reconfigure([]),
      })
      currentLanguageRef.current = null
    }
  }, [])

  const detectLanguage = useCallback((code: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!code.trim()) {
      setDetectedLanguage('plaintext')
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      const result = flourite(code, { shiki: true })
      const detected = result.language === 'Unknown' ? 'plaintext' : result.language
      setDetectedLanguage(detected)
    }, 300)
  }, [])

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        editorTheme,
        syntaxHighlighting(highlightStyle),
        lineNumbers(),
        languageCompartmentRef.current.of([]),
        placeholder('// paste your code here...'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const doc = update.state.doc.toString()
            onChangeRef.current?.(doc)
            detectLanguage(doc)
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    if (initialValueRef.current.trim()) {
      detectLanguage(initialValueRef.current)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      view.destroy()
      viewRef.current = null
    }
  }, [detectLanguage])

  // Sync external value changes into the editor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentDoc = view.state.doc.toString()
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      })
    }
  }, [value])

  // Apply language when language prop or detectedLanguage changes
  useEffect(() => {
    const langToApply = language ?? detectedLanguage
    if (langToApply && langToApply !== 'plaintext') {
      applyLanguage(langToApply)
    } else {
      clearLanguage()
    }
  }, [language, detectedLanguage, applyLanguage, clearLanguage])

  // Close menu on outside click
  useEffect(() => {
    if (!showLanguageMenu) return

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowLanguageMenu(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageMenu])

  // Focus search input when menu opens
  useEffect(() => {
    if (showLanguageMenu) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
  }, [showLanguageMenu])

  const displayLanguage = language ?? detectedLanguage
  const isAutoDetect = !language

  const allOptions = [{ id: 'auto', label: 'Auto-detect' }, ...LANGUAGES]

  const filteredOptions = search
    ? allOptions.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : allOptions

  function handleSelectLanguage(id: string) {
    setShowLanguageMenu(false)
    setSearch('')
    if (id === 'auto') {
      onLanguageChangeRef.current?.(undefined)
    } else {
      onLanguageChangeRef.current?.(id)
    }
  }

  return (
    <div className={twMerge('overflow-hidden border border-zinc-800 bg-zinc-950/50', className)}>
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-red-500" />
          <span className="size-3 rounded-full bg-amber-500" />
          <span className="size-3 rounded-full bg-emerald-500" />
        </div>
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              setShowLanguageMenu(!showLanguageMenu)
              setSearch('')
            }}
            className={twMerge(
              'flex items-center gap-1.5 rounded px-2 py-1',
              'font-mono text-xs transition-colors cursor-pointer',
              'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
            )}
          >
            {isAutoDetect ? (
              <>
                <span className="text-zinc-600">auto</span>
                {displayLanguage !== 'plaintext' && (
                  <>
                    <span className="text-zinc-700">&middot;</span>
                    <span className="text-zinc-400">{displayLanguage}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-zinc-400">{displayLanguage}</span>
            )}
            <svg
              className={twMerge(
                'size-3 text-zinc-600 transition-transform',
                showLanguageMenu && 'rotate-180',
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLanguageMenu && (
            <div
              ref={menuRef}
              className={twMerge(
                'absolute right-0 top-full z-50 mt-1',
                'w-48 overflow-hidden rounded border border-zinc-800',
                'bg-zinc-900 shadow-lg shadow-black/50',
              )}
            >
              <div className="border-b border-zinc-800 p-1.5">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="search..."
                  className={twMerge(
                    'w-full rounded bg-zinc-800/50 px-2 py-1',
                    'font-mono text-xs text-zinc-300 placeholder:text-zinc-600',
                    'outline-none focus:ring-1 focus:ring-zinc-700',
                  )}
                />
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filteredOptions.map((opt) => {
                  const isSelected =
                    (opt.id === 'auto' && isAutoDetect) ||
                    (opt.id !== 'auto' && !isAutoDetect && opt.id === language)

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectLanguage(opt.id)}
                      className={twMerge(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left',
                        'font-mono text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-zinc-800 text-emerald-500'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300',
                      )}
                    >
                      {opt.label}
                      {opt.id === 'auto' && detectedLanguage !== 'plaintext' && (
                        <span className="text-zinc-600">{detectedLanguage}</span>
                      )}
                    </button>
                  )
                })}
                {filteredOptions.length === 0 && (
                  <span className="block px-3 py-1.5 font-mono text-xs text-zinc-600">
                    no results
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div ref={containerRef} className="h-80 bg-[#111111]" />
    </div>
  )
}

export { CodeEditor, type CodeEditorProps }
