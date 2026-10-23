'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, LifeBuoy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type Ticket = {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  user_name: string
  user_email: string
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

const PAGE_SIZE = 20

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(status !== 'all' ? { status } : {}),
    })
    fetch(`/api/admin/support-tickets?${params}`, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setTickets(data.tickets ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [status, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHead title="Support Tickets" description="Questions and issues raised by buyers and sellers." />

      <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
        <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load tickets</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent></Card>
      ) : tickets.length === 0 ? (
        <EmptyState icon="LifeBuoy" title="No tickets" description="Nothing matches this filter." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/support-tickets/${t.id}`}>
              <Card interactive>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <LifeBuoy className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{t.subject}</span>
                      <Badge variant={statusVariant[t.status] ?? 'muted'} className="shrink-0">
                        {statusLabel[t.status] ?? t.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.user_name} ({t.user_email}){t.product_title ? ` · ${t.product_title}` : ''}
                      {' · '}Updated {new Date(t.updated_at).toLocaleDateString()}
                      {t.reply_count > 0 ? ` · ${t.reply_count} repl${t.reply_count === 1 ? 'y' : 'ies'}` : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} ticket{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
