'use client'

import { Toggle } from '@/components/ui/toggle'

function ToggleDemo() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Toggle label="roast mode" defaultChecked />
      <Toggle label="roast mode" />
      <Toggle disabled label="disabled" />
    </div>
  )
}

export { ToggleDemo }
