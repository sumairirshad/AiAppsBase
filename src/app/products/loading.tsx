import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="container py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-[180px] rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Skeleton className="mb-4 h-5 w-20" />
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Skeleton className="mb-4 h-4 w-24" />
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
