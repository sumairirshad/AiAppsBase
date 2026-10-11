import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser, getBuyerOrderReceipt } from '@/lib/dashboard'
import { PrintReceiptButton } from '@/components/buyer/print-receipt-button'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) notFound()

  const order = await getBuyerOrderReceipt(params.id, user.id)
  if (!order) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/buyer/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
        <PrintReceiptButton />
      </div>

      <Card className="p-8">
        <CardContent className="space-y-6 p-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-xl font-bold">Receipt</h1>
              <p className="text-sm text-muted-foreground">AIAppsBase</p>
            </div>
            <Badge variant={statusVariant[order.status] ?? 'muted'} className="capitalize">{order.status}</Badge>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
              <p className="font-mono">{order.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
              <p>{order.date}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</p>
              <p>{order.buyerName}</p>
              <p className="text-muted-foreground">{order.buyerEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sold by</p>
              <p>{order.sellerName}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">License</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{order.category}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{order.licenseType}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {order.amount === 0 ? 'Free' : `$${order.amount.toFixed(2)}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{order.amount === 0 ? 'Free' : `$${order.amount.toFixed(2)}`}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">License key: {order.licenseKey}</p>
        </CardContent>
      </Card>
    </div>
  )
}
