import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { TableSkeleton } from '@/components/skeletons/patterns'

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />

      <Card className="mb-6 mt-6 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-9 w-full rounded-lg" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="mt-6">
        <TableSkeleton columns={5} rows={5} title="Earnings" />
      </div>
      <div className="mt-6">
        <TableSkeleton columns={5} rows={3} title="Withdrawal history" />
      </div>
    </div>
  )
}
