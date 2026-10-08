import { Skeleton } from '@/components/ui/skeleton'
import { CardListSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-6">
        <CardListSkeleton rows={4} />
      </div>
    </div>
  )
}
