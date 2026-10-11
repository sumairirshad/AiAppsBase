'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Flag, CheckCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type ProductReport = {
  id: string; reason: string; status: 'open' | 'resolved'; date: string
  product_id: string; product_title: string
  reporter_id: string; reporter_name: string
}

const PAGE_SIZE = 20

export default function AdminProductReportsPage() {
  const [reports, setReports] = useState<ProductReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(status !== 'all' ? { status } : {}),
    })
    fetch(`/api/admin/product-reports?${params}`, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setReports(data.reports ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [status, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const resolve = async (id: string) => {
    setResolvingId(id)
    try {
      const res = await fetch(`/api/admin/product-reports/${id}`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve report')
      if (status !== 'all') {
        setReports((prev) => prev.filter((r) => r.id !== id))
        setTotal((t) => t - 1)
      } else {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)))
      }
      toast.success('Report resolved')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHead title="Product Reports" description="Listings buyers have flagged for review." />

      <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
        <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load reports</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent></Card>
      ) : reports.length === 0 ? (
        <EmptyState icon="Flag" title="No reports" description="Nothing has been flagged." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Flag className="size-3.5 text-destructive" />
                      <Link href={`/product/${r.product_id}`} className="hover:text-primary">{r.product_title}</Link>
                      <Badge variant={r.status === 'open' ? 'warning' : 'success'}>{r.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reported by <Link href={`/admin/users/${r.reporter_id}`} className="hover:text-primary">{r.reporter_name}</Link> · {r.date}
                    </p>
                  </div>
                  {r.status === 'open' && (
                    <Button size="sm" variant="outline" onClick={() => resolve(r.id)} loading={resolvingId === r.id} disabled={resolvingId === r.id}>
                      <CheckCircle className="size-4" /> Resolve
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} report{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
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
