import Link from 'next/link'
import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getBuyerReviews } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function BuyerReviewsPage() {
  const user = await getCurrentUser()
  const reviews = await getBuyerReviews(user?.id ?? '')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Your reviews" description="Reviews you've written for your purchases." />
      {reviews.length === 0 ? (
        <EmptyState icon="Star" title="No reviews yet" description="After a purchase, share your feedback to help other buyers." actionLabel="View purchases" actionHref="/buyer/purchases" />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Link href={`/product/${r.productId}`} className="font-medium hover:text-primary">{r.product}</Link>
                  <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('size-4', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted')} />)}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
