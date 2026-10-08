import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/** One stat card matching components/dashboard/stat-card.tsx's layout. */
export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-7 w-24" />
    </Card>
  )
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  )
}

/** A chart panel's loading state: a titled card with a chart-shaped block. */
export function ChartCardSkeleton({ span, height = 'h-64' }: { span?: 'lg:col-span-2'; height?: string }) {
  return (
    <Card className={span}>
      <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
      <CardContent>
        <Skeleton className={`${height} w-full rounded-lg`} />
      </CardContent>
    </Card>
  )
}

/** Skeleton rows for a `<table>`-shaped list (orders, customers, settlements, etc.). */
export function TableSkeleton({ columns = 5, rows = 6, title }: { columns?: number; rows?: number; title?: string }) {
  return (
    <Card>
      {title && <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>}
      <CardContent className="space-y-0 p-0">
        <div className="flex items-center gap-6 border-b border-border px-6 py-3">
          {Array.from({ length: columns }).map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 border-b border-border/60 px-6 py-3.5 last:border-0">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={c === 0 ? 'h-4 w-28' : 'h-4 w-16'} />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** A vertical list of card rows: image/avatar + two text lines + a right-side action (purchases, downloads, reviews, notifications). */
export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** A profile/settings form: label+input pairs and a submit button. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </CardContent>
    </Card>
  )
}

/** Avatar + name + meta line, for seller/user profile headers. */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  )
}

/** One product card matching marketplace/product-card.tsx's ProductCard layout. */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

/** Matches marketplace/product-detail.tsx's ProductDetail layout: breadcrumb, gallery, title/stats, tabs, sidebar. */
export function ProductDetailSkeleton() {
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-1.5">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0 space-y-8">
          <div className="space-y-3">
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[16/9] rounded-lg" />)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-9 w-2/3" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-3 text-center">
                  <Skeleton className="mx-auto mb-2 h-4 w-4" />
                  <Skeleton className="mx-auto h-5 w-10" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-6 border-b border-border pb-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-16" />)}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-11 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
