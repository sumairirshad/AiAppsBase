import Link from 'next/link'
import { Download, Key } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getBuyerOrders } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function BuyerDownloadsPage() {
  const user = await getCurrentUser()
  const orders = (await getBuyerOrders(user?.id ?? '', 100)).filter((o) => o.status === 'completed')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead title="Downloads" description="Every project you have access to." />
      {orders.length === 0 ? (
        <EmptyState icon="Download" title="Nothing to download yet" description="Files from your completed purchases will appear here." actionLabel="Browse marketplace" actionHref="/products" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className={cn('size-12 shrink-0 rounded-lg bg-gradient-to-br', o.gradient)} />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${o.productId}`} className="font-medium hover:text-primary">{o.product}</Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Key className="size-3" /> <span className="font-mono">{o.licenseKey}</span> · {o.license}
                  </div>
                </div>
                {o.downloadable ? (
                  <Button variant="outline" asChild><a href={`/api/orders/${o.id}/download`}><Download className="size-4" /> Download</a></Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No file attached</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
