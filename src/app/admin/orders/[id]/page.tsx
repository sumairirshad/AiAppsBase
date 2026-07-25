import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, User, Store, Key, CreditCard, CheckCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAdminOrderDetail } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

const statusLabel: Record<string, string> = {
  completed: 'Payment captured', refunded: 'Payment refunded', disputed: 'Payment disputed',
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getAdminOrderDetail(params.id)
  if (!order) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Booking {order.id}</h1>
          <p className="text-muted-foreground">{order.date}</p>
        </div>
        <Badge variant={statusVariant[order.status] ?? 'muted'} className="w-fit text-sm capitalize">{order.status}</Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="size-4" /> Product</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Link href={`/product/${order.product_id}`} className="font-medium hover:text-primary">{order.product}</Link>
            <p className="text-muted-foreground">{order.category}</p>
            <p className="text-muted-foreground">License: {order.license_type}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-2xl font-bold">${order.amount}</p>
            <p className="text-muted-foreground">{statusLabel[order.status] ?? order.status}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Key className="size-3" /> {order.license_key}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="size-4" /> Buyer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Link href={`/admin/users/${order.buyer_id}`} className="font-medium hover:text-primary">{order.buyer}</Link>
            <p className="text-muted-foreground">{order.buyer_email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Store className="size-4" /> Provider</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Link href={`/admin/sellers/${order.seller_id}`} className="font-medium hover:text-primary">{order.seller}</Link>
            <p className="text-muted-foreground">{order.seller_email}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CheckCircle className="size-4" /></span>
            <div>
              <p className="font-medium">Booking placed &amp; payment captured</p>
              <p className="text-xs text-muted-foreground">{order.date}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
