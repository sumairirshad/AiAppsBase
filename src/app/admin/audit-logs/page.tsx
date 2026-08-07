'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type AuditLog = {
  id: string; action: string; target_type: string; target_id: string
  reason: string; notes: string | null; ip_address: string | null; date: string
  admin_name: string; admin_email: string
}

const targetHref: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  seller: (id) => `/admin/sellers/${id}`,
  review: () => `/admin/reviews`,
}

const PAGE_SIZE = 25

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [targetType, setTargetType] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(targetType !== 'all' ? { targetType } : {}),
    })
    fetch(`/api/admin/audit-logs?${params}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [targetType, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHead title="Audit Logs" description="Every administrative action, with reason, notes, and before/after values." />

      <Select value={targetType} onValueChange={(v) => { setTargetType(v); setPage(1) }}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Target type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All target types</SelectItem>
          <SelectItem value="user">Users</SelectItem>
          <SelectItem value="seller">Providers</SelectItem>
          <SelectItem value="review">Reviews</SelectItem>
        </SelectContent>
      </Select>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load audit logs</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent></Card>
      ) : logs.length === 0 ? (
        <EmptyState icon="ClipboardList" title="No audit log entries" description="Administrative actions will appear here as they happen." />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const href = targetHref[log.target_type]?.(log.target_id)
            return (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" className="capitalize">{log.action.replace(/[._]/g, ' ')}</Badge>
                      <span className="text-sm text-muted-foreground">
                        by <span className="font-medium text-foreground">{log.admin_name}</span>
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.date}</span>
                  </div>
                  <p className="mt-2 text-sm"><span className="text-muted-foreground">Reason:</span> {log.reason}</p>
                  {log.notes && <p className="mt-1 text-sm"><span className="text-muted-foreground">Notes:</span> {log.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">Target: {log.target_type}</span>
                    {href ? <Link href={href} className="font-mono hover:text-primary">{log.target_id.slice(0, 12)}</Link> : <span className="font-mono">{log.target_id.slice(0, 12)}</span>}
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} entr{total === 1 ? 'y' : 'ies'} · page {page} of {totalPages}</span>
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
