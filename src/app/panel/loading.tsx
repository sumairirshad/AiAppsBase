import { Skeleton } from '@/components/ui/skeleton'
import { StatCardsSkeleton, ChartCardSkeleton, TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <StatCardsSkeleton count={4} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton span="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton span="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>

      <TableSkeleton columns={5} rows={5} title="Top products" />
      <TableSkeleton columns={6} rows={5} title="Recent orders" />
    </div>
  )
}
