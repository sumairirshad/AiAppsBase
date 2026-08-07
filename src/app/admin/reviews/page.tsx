'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { ReasonDialog } from '@/components/dashboard/reason-dialog'

type Review = {
  id: string; rating: number; comment: string; verified: boolean; helpful: number; date: string
  author_id: string; author: string; author_email: string
  product_id: string; product: string; seller: string
}

const PAGE_SIZE = 20

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page), pageSize: String(PAGE_SIZE),
      ...(search ? { search } : {}), ...(rating !== 'all' ? { rating } : {}),
    })
    const timeout = setTimeout(() => {
      fetch(`/api/admin/reviews?${params}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json()
          if (!r.ok) throw new Error(data.error || `Error ${r.status}`)
          setReviews(data.reviews ?? [])
          setTotal(data.total ?? 0)
        })
        .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
        .finally(() => setLoading(false))
    }, 300)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [search, rating, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const confirmDelete = async (reason: string, notes: string) => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete review')
      toast.success('Review deleted')
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setTotal((t) => t - 1)
      setDeleteTarget(null)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHead title="Reviews Management" description="Every review across the marketplace." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by comment, product, or author..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1) }}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} star{n === 1 ? '' : 's'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium text-destructive">Failed to load reviews</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent></Card>
      ) : reviews.length === 0 ? (
        <EmptyState icon="Star" title="No reviews found" description="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9"><AvatarFallback>{r.author.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Link href={`/admin/users/${r.author_id}`} className="hover:text-primary">{r.author}</Link>
                        {r.verified && <Badge variant="success" className="px-1.5 py-0 text-[10px]">Verified</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('size-3', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                          ))}
                        </span>
                        {r.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/product/${r.product_id}`}><Badge variant="muted">{r.product}</Badge></Link>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">Provider: {r.seller}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} review{total === 1 ? '' : 's'} · page {page} of {totalPages}</span>
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
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this review?"
        description="This permanently removes the review. This action requires a reason and will be recorded in the audit log."
        confirmLabel="Delete review"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
