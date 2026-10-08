import { Skeleton } from '@/components/ui/skeleton'
import { ProfileHeaderSkeleton, TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-4 w-28" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <ProfileHeaderSkeleton />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex gap-6 border-b border-border">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-3 h-5 w-24" />)}
      </div>

      <TableSkeleton columns={5} rows={5} />
    </div>
  )
}
