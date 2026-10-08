import { Skeleton } from '@/components/ui/skeleton'
import { StatCardsSkeleton, TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6">
        <StatCardsSkeleton count={4} />
      </div>
      <div className="mt-6">
        <TableSkeleton columns={7} rows={8} title="Recent transactions" />
      </div>
    </div>
  )
}
