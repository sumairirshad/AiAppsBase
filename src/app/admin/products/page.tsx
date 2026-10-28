'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, CheckCircle, XCircle, AlertCircle, Clock, Search, ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react'

import { formatPrice, timeAgo } from '@/lib/utils'
import { fundingPlatformLabel } from '@/lib/funding-platforms'
import type { ProductStatus } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

type TabKey = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
]

const statusConfig: Record<ProductStatus, { label: string; icon: typeof CheckCircle; variant: 'success' | 'warning' | 'destructive' }> = {
  approved: { label: 'Approved', icon: CheckCircle, variant: 'success' },
  pending: { label: 'Pending', icon: Clock, variant: 'warning' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' },
  suspended: { label: 'Suspended', icon: AlertCircle, variant: 'warning' },
}

interface AdminProduct {
  id: string; title: string; description: string; price: number; category: string
  status: ProductStatus; featured: boolean; createdAt: string; seller: { id: string; name: string; email: string }
  githubRepoName?: string | null; fundingLinks?: { platform: string; url: string }[]
}

const PAGE_SIZE = 20

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<{ ids: string[]; status: ProductStatus } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(search ? { search } : {}), ...(activeTab !== 'all' ? { status: activeTab } : {}),
    })
    const timeout = setTimeout(() => {
      fetch(`/api/admin/products?${params}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
          setProducts(data.products ?? [])
          setTotal(data.total ?? 0)
          setSelectedIds(new Set())
        })
        .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
        .finally(() => setLoading(false))
    }, 300)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [search, activeTab, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const applyStatus = async (reason: string, notes: string) => {
    if (!pendingAction) return
    setSaving(true)
    try {
      for (const id of pendingAction.ids) {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: pendingAction.status, reason, notes }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update product')
      }
      setProducts((prev) => {
        // Viewing a specific status tab: a product that just moved to a
        // different status no longer belongs on this page, so drop it
        // instead of leaving a stale row until the next fetch.
        if (activeTab !== 'all' && pendingAction.status !== activeTab) {
          return prev.filter((p) => !pendingAction.ids.includes(p.id))
        }
        return prev.map((p) => (pendingAction.ids.includes(p.id) ? { ...p, status: pendingAction.status } : p))
      })
      setTotal((prev) => (activeTab !== 'all' && pendingAction.status !== activeTab ? prev - pendingAction.ids.length : prev))
      setSelectedIds(new Set())
      toast.success(pendingAction.ids.length > 1 ? `${pendingAction.ids.length} products updated` : 'Product updated')
      setPendingAction(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleFeatured = async (product: AdminProduct) => {
    const next = !product.featured
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, featured: next } : p)))
    try {
      const res = await fetch(`/api/admin/products/${product.id}/featured`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      toast.success(next ? 'Marked as featured' : 'Removed from featured')
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, featured: !next } : p)))
      toast.error((err as Error).message)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(products.map((p) => p.id)))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHead title="Product Management" description="Review submissions and manage product listings." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1) }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Button size="sm" onClick={() => setPendingAction({ ids: Array.from(selectedIds), status: 'approved' })}>
            <CheckCircle className="size-4" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setPendingAction({ ids: Array.from(selectedIds), status: 'rejected' })}>
            <XCircle className="size-4" /> Reject
          </Button>
        </div>
      )}

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load products</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      ) : products.length === 0 ? (
        <EmptyState icon="Package" title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 px-6 py-3">
                    <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0} onChange={toggleSelectAll} className="rounded border-input" />
                  </th>
                  <th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">Seller</th>
                  <th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Featured</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = statusConfig[product.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={product.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3">
                        <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="rounded border-input" />
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/product/${product.id}`} className="flex items-center gap-3 hover:text-primary">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Package className="size-4" /></span>
                          <span className="font-medium">{product.title}</span>
                        </Link>
                        {/* Detected external donation links, for compliance/security review —
                            each must be the developer's own page, never the platform's homepage. */}
                        {product.fundingLinks && product.fundingLinks.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1 pl-12">
                            {product.fundingLinks.map((f, i) => (
                              <a
                                key={`${f.platform}-${i}`}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={f.url}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 hover:underline dark:text-rose-400"
                              >
                                <Heart className="size-2.5" /> {fundingPlatformLabel(f.platform)}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <Link href={`/admin/sellers/${product.seller.id}`} className="hover:text-primary">{product.seller.name}</Link>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{product.category}</td>
                      <td className="px-3 py-3 font-medium">{formatPrice(product.price)}</td>
                      <td className="px-3 py-3 text-muted-foreground">{timeAgo(product.createdAt)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={status.variant} className="w-fit gap-1"><StatusIcon className="size-3" /> {status.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleFeatured(product)}
                          aria-label={product.featured ? 'Remove from featured' : 'Mark as featured'}
                          className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-amber-500"
                        >
                          <Star className={`size-4 ${product.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => setPendingAction({ ids: [product.id], status: 'approved' })}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => setPendingAction({ ids: [product.id], status: 'rejected' })}>Reject</Button>
                            </>
                          )}
                          {product.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => setPendingAction({ ids: [product.id], status: 'suspended' })}>Suspend</Button>
                          )}
                          {(product.status === 'rejected' || product.status === 'suspended') && (
                            <Button size="sm" onClick={() => setPendingAction({ ids: [product.id], status: 'approved' })}>Approve</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} product{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
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

      <ReasonDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction ? `${statusConfig[pendingAction.status].label} ${pendingAction.ids.length > 1 ? `${pendingAction.ids.length} products` : 'this product'}?` : ''}
        description="This action requires a reason and will be recorded in the audit log."
        confirmLabel={pendingAction ? statusConfig[pendingAction.status].label : 'Confirm'}
        destructive={pendingAction?.status === 'rejected'}
        loading={saving}
        onConfirm={applyStatus}
      />
    </div>
  )
}
