'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Package, CheckCircle, XCircle, AlertCircle, Clock, Search } from 'lucide-react'

import { formatPrice, timeAgo } from '@/lib/utils'
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
  status: ProductStatus; createdAt: string; seller: { id: string; name: string; email: string }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<{ ids: string[]; status: ProductStatus } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/admin/products')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
        setProducts(data.products ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products
    .filter((p) => activeTab === 'all' || p.status === activeTab)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.seller.name?.toLowerCase().includes(search.toLowerCase()))

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
      setProducts((prev) => prev.map((p) => (pendingAction.ids.includes(p.id) ? { ...p, status: pendingAction.status } : p)))
      setSelectedIds(new Set())
      toast.success(pendingAction.ids.length > 1 ? `${pendingAction.ids.length} products updated` : 'Product updated')
      setPendingAction(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
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
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((p) => p.id)))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <PageHead title="Product Management" description="Review submissions and manage product listings." />
        <span className="text-sm text-muted-foreground">{products.filter((p) => p.status === 'pending').length} pending review</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const count = tab.key === 'all' ? products.length : products.filter((p) => p.status === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
      ) : filtered.length === 0 ? (
        <EmptyState icon="Package" title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 px-6 py-3">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-input" />
                  </th>
                  <th className="px-3 py-3 font-medium">Product</th><th className="px-3 py-3 font-medium">Seller</th>
                  <th className="px-3 py-3 font-medium">Category</th><th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
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
