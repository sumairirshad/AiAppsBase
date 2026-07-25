'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

type Order = {
  id: string; amount: number; status: string; license_type: string; date: string
  product: string; product_id: string; buyer: string; buyer_email: string; seller: string; seller_id: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

const PAGE_SIZE = 20

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}),
    })
    const timeout = setTimeout(() => {
      fetch(`/api/admin/orders?${params}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
          setOrders(data.orders ?? [])
          setTotal(data.total ?? 0)
        })
        .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
        .finally(() => setLoading(false))
    }, 300)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [search, status, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHead title="Booking Management" description="Every purchase across the marketplace, with buyer and provider details." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, product, or buyer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      ) : orders.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="No bookings found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Buyer</th><th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs hover:text-primary">{o.id}</Link>
                    </td>
                    <td className="px-6 py-3">{o.product}</td>
                    <td className="px-6 py-3 text-muted-foreground">{o.buyer}</td>
                    <td className="px-6 py-3 text-muted-foreground">{o.seller}</td>
                    <td className="px-6 py-3 font-medium">${o.amount}</td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[o.status] ?? 'muted'}>{o.status}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} booking{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
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
