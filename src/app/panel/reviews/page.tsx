import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getSellerReviews } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SellerReviewsPage() {
  const user = await getCurrentUser()
  const reviews = await getSellerReviews(user?.id ?? '')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Reviews" description="Feedback from customers across your products." />
      {reviews.length === 0 ? (
        <EmptyState icon="Star" title="No reviews yet" description="Reviews from your customers will appear here." />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10"><AvatarFallback>{r.author.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {r.author}
                        {r.verified && <Badge variant="success" className="px-1.5 py-0 text-[10px]">Verified</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('size-3', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted')} />)}</span>
                        {r.date}
                      </div>
                    </div>
                  </div>
                  <Badge variant="muted">{r.product}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
