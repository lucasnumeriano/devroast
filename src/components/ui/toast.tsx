'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

const toastVariants = tv({
  base: [
    'fixed bottom-6 right-6 z-50',
    'flex items-center gap-3 px-4 py-3',
    'bg-zinc-900 border border-zinc-800',
    'font-mono text-xs text-zinc-300',
    'transition-all duration-300',
  ],
  variants: {
    visible: {
      true: 'translate-y-0 opacity-100',
      false: 'translate-y-2 opacity-0 pointer-events-none',
    },
  },
  defaultVariants: {
    visible: false,
  },
})

type ToastData = {
  message: string
  type?: 'error' | 'info'
}

type ToastContextValue = {
  showToast: (data: ToastData) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((data: ToastData) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setToast(data)
    setVisible(true)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      timerRef.current = setTimeout(() => {
        setToast(null)
      }, 300)
    }, 5000)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  const borderColor = toast?.type === 'error' ? 'border-red-500/50' : 'border-zinc-800'

  return (
    <ToastContext value={value}>
      {children}
      {toast && (
        <div className={twMerge(toastVariants({ visible }), borderColor)} role="alert">
          {toast.type === 'error' && <span className="text-red-500">{'//'}&#160;error:</span>}
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext>
  )
}

export { ToastProvider, toastVariants, useToast }
