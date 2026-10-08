import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div>
      <div className="h-44 bg-muted sm:h-56" />
      <div className="container">
        <div className="relative -mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Skeleton className="size-28 shrink-0 rounded-full border-4 border-background sm:size-32" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        <Skeleton className="mt-6 h-4 w-full max-w-2xl" />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Skeleton className="mb-2 h-4 w-4" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="mt-1 h-3 w-16" />
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Skeleton className="mb-6 h-7 w-40" />
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
