import { Skeleton } from '@/components/ui/skeleton'
import { CardListSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-7 w-52" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <CardListSkeleton rows={5} />
    </div>
  )
}
