import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-6">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  )
}
