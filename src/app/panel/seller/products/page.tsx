'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2, Eye, History, RefreshCw, UploadCloud, AlertTriangle, Rocket, Heart } from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { ProductImage, mediaChipClass } from '@/components/products/product-image'
import { fundingPlatformLabel } from '@/lib/funding-platforms'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive',
  suspended: 'muted',
}

// A product can land back in 'pending' two very different ways: as a brand
// new submission's first review (pending_reason is null), or because an
// already-live listing's content just changed and needs re-review (see
// migration 035). Without this, both look identical in the UI and a seller
// has no way to tell why an approved listing suddenly vanished from the
// storefront.
const pendingReasonLabel: Record<string, string> = {
  content_updated: 'Pending re-review — repository content was refreshed',
  edited: 'Pending re-review — listing details were edited',
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeletingId(confirmTarget.id)
    try {
      const res = await fetch(`/api/products/${confirmTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete product')
      setProducts((prev) => prev.filter((p) => p.id !== confirmTarget.id))
      toast.success('Product deleted')
      setConfirmTarget(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const refreshGithubStats = async (productId: string) => {
    setRefreshingId(productId)
    try {
      const res = await fetch(`/api/products/${productId}/sync-github-stats`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to refresh stats')
      // data.stats.fundingLinks is camelCase from the sync service; every
      // other product field here (including the stored funding_links) is
      // snake_case straight off the DB row, so remap it to match.
      const { fundingLinks, ...stats } = data.stats
      setProducts((prev) => prev.map((p) => (
        p.id === productId ? { ...p, ...stats, funding_links: fundingLinks ?? p.funding_links } : p
      )))
      toast.success('GitHub stats & funding links refreshed')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRefreshingId(null)
    }
  }

  // Re-fetches and re-stores the repo archive buyers actually download —
  // use this to publish repo updates, or to retry after a failed snapshot
  // (e.g. once GitHub has been reconnected).
  const syncGithubSnapshot = async (productId: string) => {
    setSyncingId(productId)
    try {
      const res = await fetch(`/api/products/${productId}/sync-github-snapshot`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sync repository snapshot')
      setProducts((prev) => prev.map((p) => (
        p.id === productId
          ? {
              ...p,
              github_snapshot_status: 'ready',
              github_snapshot_error: null,
              status: data.statusReset ? 'pending' : p.status,
              pending_reason: data.statusReset ? 'content_updated' : p.pending_reason,
            }
          : p
      )))
      toast.success(data.statusReset
        ? 'Snapshot refreshed — this listing is back in review since its content changed'
        : 'Snapshot refreshed — buyers will now get the latest version')
    } catch (err) {
      setProducts((prev) => prev.map((p) => (
        p.id === productId ? { ...p, github_snapshot_status: 'failed', github_snapshot_error: (err as Error).message } : p
      )))
      toast.error((err as Error).message)
    } finally {
      setSyncingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHead title="My products" description="Manage and track your AI-built products." />
        <Button asChild>
          <Link href="/panel/seller/add-product">
            <PlusCircle className="size-4" /> Add product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="Package"
          title="No products yet"
          description="Start selling your AI creations today!"
          actionLabel="Create your first product"
          actionHref="/panel/seller/add-product"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} interactive className="group flex flex-col overflow-hidden">
              <div className="group/media relative aspect-video overflow-hidden bg-muted">
                <ProductImage
                  src={product.screenshots?.[0]}
                  alt={product.title}
                  logoClassName="size-12"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <Badge className={cn('border-0', mediaChipClass, 'bg-black/40 dark:group-has-[[data-fallback]]/media:bg-black/40')}>{product.category}</Badge>
                  <Badge variant={statusVariant[product.status] ?? 'muted'}>
                    {product.status === 'pending' && product.pending_reason ? 'Re-review' : product.status}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
                    {product.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {product.description}
                  </p>
                  {Array.isArray(product.funding_links) && product.funding_links.length > 0 && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400">
                      <Heart className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        Funding links active: {product.funding_links.map((f: { platform: string }) => fundingPlatformLabel(f.platform)).join(', ')}
                      </span>
                    </p>
                  )}
                  {product.status === 'pending' && product.pending_reason && pendingReasonLabel[product.pending_reason] && (
                    <p className="mt-2 rounded-md bg-warning/10 px-2.5 py-1.5 text-xs text-warning-foreground">
                      {pendingReasonLabel[product.pending_reason]} — it&apos;s temporarily off the storefront until an admin reviews it again.
                    </p>
                  )}
                  {product.status === 'rejected' && product.rejection_reason && (
                    <p className="mt-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                      Rejected: {product.rejection_reason}
                    </p>
                  )}
                  {product.github_repo_name && product.github_snapshot_status === 'failed' && (
                    <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {product.deliverable_remote_path
                          ? 'Buyers still get the last working snapshot, but a newer sync failed: '
                          : "Buyers can't download this product yet: "}
                        {product.github_snapshot_error || 'the last snapshot attempt failed.'}{' '}
                        <Link href="/panel/seller/github" className="underline underline-offset-2">Reconnect GitHub</Link>, then sync again.
                      </span>
                    </div>
                  )}
                  {product.status === 'rejected' && (
                    <Button asChild size="sm" variant="outline" className="mt-2 w-full">
                      <Link href={`/panel/seller/edit-product/${product.id}`}>
                        <RefreshCw className="size-4" /> Resubmit for review
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <div className="text-lg font-bold">
                    {product.price === 0 ? 'Free' : `$${parseFloat(product.price).toFixed(2)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.preview_url && (
                      <a
                        href={product.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground'
                        )}
                        title="Live preview"
                      >
                        <Eye className="size-4" />
                      </a>
                    )}
                    <Link
                      href={`/panel/seller/edit-product/${product.id}`}
                      className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-primary"
                      title="Edit"
                    >
                      <Edit className="size-4" />
                    </Link>
                    <Link
                      href={`/panel/seller/products/${product.id}/versions`}
                      className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-primary"
                      title="Publish new version"
                    >
                      <Rocket className="size-4" />
                    </Link>
                    <Link
                      href={`/panel/seller/products/${product.id}/changelog`}
                      className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-primary"
                      title="Changelog"
                    >
                      <History className="size-4" />
                    </Link>
                    {product.github_repo_name && (
                      <>
                        <button
                          onClick={() => refreshGithubStats(product.id)}
                          disabled={refreshingId === product.id}
                          className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                          title="Re-sync GitHub data (stats & funding links)"
                        >
                          <RefreshCw className={cn('size-4', refreshingId === product.id && 'animate-spin')} />
                        </button>
                        <button
                          onClick={() => syncGithubSnapshot(product.id)}
                          disabled={syncingId === product.id}
                          className={cn(
                            'grid size-8 place-items-center rounded-lg border bg-muted/40 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50',
                            product.github_snapshot_status === 'failed' ? 'border-destructive/40' : 'border-border'
                          )}
                          title="Sync repository snapshot (publish latest changes to buyers)"
                        >
                          <UploadCloud className={cn('size-4', syncingId === product.id && 'animate-pulse')} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setConfirmTarget(product)}
                      disabled={deletingId === product.id}
                      className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title="Delete product?"
        description={confirmTarget ? `"${confirmTarget.title}" will be permanently deleted. This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deletingId === confirmTarget?.id}
        onConfirm={handleDelete}
      />
    </div>
  )
}
