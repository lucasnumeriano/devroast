'use client'

import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, placeholder } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

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
  className?: string
}

function CodeEditor({ value = '', onChange, className }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const initialValueRef = useRef(value)
  onChangeRef.current = onChange

  // Create editor once on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        editorTheme,
        lineNumbers(),
        javascript(),
        placeholder('// paste your code here...'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

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

  return (
    <div className={twMerge('overflow-hidden border border-zinc-800 bg-zinc-950/50', className)}>
      <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
        <span className="size-3 rounded-full bg-red-500" />
        <span className="size-3 rounded-full bg-amber-500" />
        <span className="size-3 rounded-full bg-emerald-500" />
      </div>
      <div ref={containerRef} className="h-80 bg-[#111111]" />
    </div>
  )
}

export { CodeEditor, type CodeEditorProps }
