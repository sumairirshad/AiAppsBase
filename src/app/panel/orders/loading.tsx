import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-6">
        <TableSkeleton columns={7} rows={6} />
      </div>
    </div>
  )
}
