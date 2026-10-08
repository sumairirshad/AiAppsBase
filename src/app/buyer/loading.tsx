import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { StatCardsSkeleton, ChartCardSkeleton, ProductGridSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      <StatCardsSkeleton count={4} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton />
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-3">
                <Skeleton className="size-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <ProductGridSkeleton count={3} />
      </div>
    </div>
  )
}
