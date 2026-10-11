'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CommissionRateEditor({ initialPercent }: { initialPercent: number }) {
  const [percent, setPercent] = React.useState(initialPercent)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(String(initialPercent))
  const [saving, setSaving] = React.useState(false)

  const save = async () => {
    const value = Number(draft)
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error('Enter a number between 0 and 100')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/commission-rate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update commission rate')
      setPercent(data.percent)
      setEditing(false)
      toast.success('Commission rate updated')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-8 w-20"
        />
        <Button size="sm" onClick={save} loading={saving} disabled={saving}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(String(percent)) }} disabled={saving}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 rounded-full"
      aria-label="Edit commission rate"
    >
      <Badge variant="brand">{percent}%</Badge>
      <Pencil className="size-3 text-muted-foreground" />
    </button>
  )
}
