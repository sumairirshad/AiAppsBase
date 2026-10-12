'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Plus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type ChangelogEntry = { version: string; notes: string[]; date: string }

export default function ProductChangelogPage() {
  const { id } = useParams<{ id: string }>()
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${id}/changelog`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false))
  }, [id])

  const submit = async () => {
    if (!version.trim()) {
      toast.error('Enter a version number')
      return
    }
    if (!notes.trim()) {
      toast.error('Add at least one note — one per line')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}/changelog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: version.trim(), notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add changelog entry')
      setEntries((prev) => [data.entry, ...prev])
      setVersion('')
      setNotes('')
      toast.success('Changelog entry added')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/panel/seller/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to My products
      </Link>
      <PageHead title="Changelog" description="Let buyers see what's changed in each version of this product." />

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Add a version</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="version">Version</Label>
            <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.1.0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (one per line)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'Fixed login bug\nAdded dark mode'}
              rows={4}
            />
          </div>
          <Button onClick={submit} loading={saving} disabled={saving}>
            <Plus className="size-4" /> Add entry
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon="History" title="No changelog entries yet" description="Add your first version above." />
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Card key={`${entry.version}-${entry.date}`} className="p-5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">v{entry.version}</span>
                {i === 0 && <Badge variant="success">Latest</Badge>}
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {entry.notes.map((n) => <li key={n} className="text-sm text-muted-foreground">• {n}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
