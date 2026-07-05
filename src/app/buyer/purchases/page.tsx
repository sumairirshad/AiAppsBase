import Link from 'next/link'
import { Download } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { LicenseKey } from '@/components/dashboard/license-key'
import { getCurrentUser, getBuyerOrders } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

export default async function PurchasesPage() {
  const user = await getCurrentUser()
  const orders = await getBuyerOrders(user?.id ?? '', 100)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead title="Purchase history" description="All your purchases, license keys, and downloads." />
      {orders.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="No purchases yet" description="Browse the marketplace to find your first product." actionLabel="Browse marketplace" actionHref="/products" />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <span className={cn('size-12 shrink-0 rounded-lg bg-gradient-to-br', order.gradient)} />
                  <div className="min-w-0 space-y-1.5">
                    <Link href={`/product/${order.productId}`} className="font-semibold hover:text-primary">{order.product}</Link>
                    <p className="text-xs text-muted-foreground">
                      Order {String(order.id).slice(0, 12)} · {order.date} · {order.license} license
                    </p>
                    <LicenseKey value={order.licenseKey} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">{order.amount === 0 ? 'Free' : `$${order.amount}`}</span>
                  <Badge variant={statusVariant[order.status] ?? 'muted'}>{order.status}</Badge>
                  {order.downloadable && order.status === 'completed' && (
                    <Button size="sm" asChild>
                      <a href={`/api/orders/${order.id}/download`}><Download className="size-4" /> Download</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
