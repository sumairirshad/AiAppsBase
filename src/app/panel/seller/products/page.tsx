'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Package, Edit, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive',
  suspended: 'muted',
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null)

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
              <div className="relative aspect-video overflow-hidden bg-muted">
                {product.screenshots && product.screenshots[0] ? (
                  <img
                    src={product.screenshots[0]}
                    alt={product.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <Package className="size-8" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <Badge className="border-0 bg-black/40 text-white backdrop-blur-md">{product.category}</Badge>
                  <Badge variant={statusVariant[product.status] ?? 'muted'}>{product.status}</Badge>
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
