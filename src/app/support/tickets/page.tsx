'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, MessageSquare } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type Ticket = {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  product_title: string | null
  reply_count: number
}

const statusVariant: Record<string, 'warning' | 'brand' | 'success' | 'muted'> = {
  open: 'warning',
  in_progress: 'brand',
  resolved: 'success',
  closed: 'muted',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/support/tickets', { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setTickets(data.tickets ?? [])
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHead title="Support" description="Your support tickets and their replies." />
        <Button variant="gradient" asChild>
          <Link href="/support/tickets/new"><PlusCircle className="size-4" /> New ticket</Link>
        </Button>
      </div>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load tickets</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent></Card>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="LifeBuoy"
          title="No support tickets yet"
          description="Need help with an order, a listing, or your account? Open a ticket and we'll get back to you."
          actionLabel="New ticket"
          actionHref="/support/tickets/new"
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/support/tickets/${t.id}`}>
              <Card interactive>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                      <p className="truncate font-medium">{t.subject}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.product_title ? `About ${t.product_title} · ` : ''}
                      Updated {new Date(t.updated_at).toLocaleDateString()}
                      {t.reply_count > 0 ? ` · ${t.reply_count} repl${t.reply_count === 1 ? 'y' : 'ies'}` : ''}
                    </p>
                  </div>
                  <Badge variant={statusVariant[t.status] ?? 'muted'} className="shrink-0">
                    {statusLabel[t.status] ?? t.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
