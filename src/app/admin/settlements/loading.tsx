import { Skeleton } from '@/components/ui/skeleton'
import { StatCardsSkeleton, TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6">
        <StatCardsSkeleton count={3} />
      </div>
      <div className="mb-4 mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
      </div>
      <TableSkeleton columns={7} rows={6} title="Withdrawal requests" />
    </div>
  )
}
