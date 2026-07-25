'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Star } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SellerStatusMenu } from '@/components/dashboard/seller-status-menu'
import { timeAgo } from '@/lib/utils'

type Seller = {
  id: string; name: string; email: string; sellerStatus: string; accountStatus: string; memberSince: string
  productCount: number; avgRating: number; reviewCount: number; completedOrders: number; revenue: number
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  approved: 'success', pending: 'warning', rejected: 'destructive', suspended: 'warning', banned: 'destructive',
}

const PAGE_SIZE = 20

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
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
      fetch(`/api/admin/sellers?${params}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
          setSellers(data.sellers ?? [])
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
      <PageHead title="Provider Management" description="Approve, review, and manage sellers on the platform." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load providers</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      ) : sellers.length === 0 ? (
        <EmptyState icon="Store" title="No providers found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Products</th>
                  <th className="px-6 py-3 font-medium">Rating</th>
                  <th className="px-6 py-3 font-medium">Revenue</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <Link href={`/admin/sellers/${s.id}`} className="group flex items-center gap-3">
                        <Avatar className="size-8"><AvatarFallback>{s.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium group-hover:text-primary">{s.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[s.sellerStatus] ?? 'muted'} className="capitalize">{s.sellerStatus}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{s.productCount}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {s.reviewCount > 0 ? <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {s.avgRating} ({s.reviewCount})</span> : '—'}
                    </td>
                    <td className="px-6 py-3 font-medium">${s.revenue}</td>
                    <td className="px-6 py-3 text-muted-foreground">{timeAgo(s.memberSince)}</td>
                    <td className="px-6 py-3 text-right">
                      <SellerStatusMenu
                        sellerId={s.id}
                        currentStatus={s.sellerStatus}
                        onUpdated={(next) => setSellers((prev) => prev.map((x) => (x.id === s.id ? { ...x, sellerStatus: next } : x)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} provider{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
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
