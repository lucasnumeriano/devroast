'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail in insecure contexts
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      {copied ? '$ copied!' : '$ share_roast'}
    </Button>
  )
}
