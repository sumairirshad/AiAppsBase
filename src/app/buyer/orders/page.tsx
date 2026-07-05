import Link from 'next/link'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getBuyerOrders } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

export default async function BuyerOrdersPage() {
  const user = await getCurrentUser()
  const orders = await getBuyerOrders(user?.id ?? '', 100)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead title="Orders & invoices" description="Your full purchase history." />
      {orders.length === 0 ? (
        <EmptyState icon="Receipt" title="No orders yet" description="Your orders and invoices will appear here." actionLabel="Browse marketplace" actionHref="/products" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">License</th><th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3 font-mono text-xs">{String(o.id).slice(0, 12)}</td>
                    <td className="px-6 py-3"><Link href={`/product/${o.productId}`} className="hover:text-primary">{o.product}</Link></td>
                    <td className="px-6 py-3 text-muted-foreground">{o.license}</td>
                    <td className="px-6 py-3 font-medium">{o.amount === 0 ? 'Free' : `$${o.amount}`}</td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[o.status] ?? 'muted'}>{o.status}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
                    <td className="px-6 py-3 text-right">
                      {o.downloadable && o.status === 'completed' && (
                        <Button size="sm" variant="outline" asChild><a href={`/api/orders/${o.id}/download`}><Download className="size-4" /> Download</a></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
