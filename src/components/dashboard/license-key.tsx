'use client'

import * as React from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function LicenseKey({ value }: { value: string }) {
  const [revealed, setRevealed] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const masked = value && value.length >= 8
    ? `${value.slice(0, 4)}-••••-••••-${value.slice(-4)}`
    : '••••-••••-••••-••••'

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
        {revealed ? value : masked}
      </code>
      <button onClick={() => setRevealed((r) => !r)} className="text-muted-foreground hover:text-foreground" aria-label="Toggle key">
        {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <button
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); toast.success('License key copied'); setTimeout(() => setCopied(false), 1500) }}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Copy key"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}
