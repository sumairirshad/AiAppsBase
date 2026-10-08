import { Skeleton } from '@/components/ui/skeleton'
import { StatCardsSkeleton, ChartCardSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <StatCardsSkeleton count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCardSkeleton span="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>
      <ChartCardSkeleton />
    </div>
  )
}
