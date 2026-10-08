import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="container py-10">
      <Skeleton className="mb-8 h-9 w-40" />
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="size-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="ml-auto h-6 w-14" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="my-4 h-px w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="mt-5 h-9 w-full rounded-lg" />
          <Skeleton className="mt-4 h-9 w-full rounded-lg" />
        </Card>
      </div>
    </div>
  )
}
