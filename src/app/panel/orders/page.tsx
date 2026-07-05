import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { getCurrentUser, getSellerOrders } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  completed: 'success', pending: 'warning', refunded: 'destructive', disputed: 'warning',
}

export default async function SellerOrdersPage() {
  const user = await getCurrentUser()
  const orders = await getSellerOrders(user?.id ?? '', 100)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHead title="Orders" description="Every sale across your products." />
      {orders.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="No orders yet" description="When customers buy your products, their orders show up here." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order</th><th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Buyer</th><th className="px-6 py-3 font-medium">License</th>
                  <th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3 font-mono text-xs">{String(o.id).slice(0, 12)}</td>
                    <td className="px-6 py-3">{o.product}</td>
                    <td className="px-6 py-3 text-muted-foreground">{o.buyer}</td>
                    <td className="px-6 py-3 text-muted-foreground">{o.license}</td>
                    <td className="px-6 py-3 font-medium">${o.amount}</td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[o.status] ?? 'muted'}>{o.status}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
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
