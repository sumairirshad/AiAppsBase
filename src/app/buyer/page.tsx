import Link from 'next/link'
import {
  ShoppingBag, DollarSign, Download, Heart, ArrowRight, Key, Star,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { SpendAreaChart } from '@/components/dashboard/charts'
import { ProductCard } from '@/components/marketplace/product-card'
import {
  buyerStats, buyerPurchases, buyerWishlist, buyerRecommended, buyerSpendSeries,
} from '@/lib/dashboard-data'

const statusVariant: Record<string, 'success' | 'destructive'> = {
  completed: 'success', refunded: 'destructive',
}

export default function BuyerDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Your dashboard</h1>
        <p className="text-muted-foreground">Manage your purchases, downloads, licenses, and wishlist.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Purchases" value={buyerStats.purchases} icon={ShoppingBag} />
        <StatCard label="Total spent" value={buyerStats.spent} prefix="$" icon={DollarSign} />
        <StatCard label="Downloads" value={buyerStats.downloads} icon={Download} />
        <StatCard label="Wishlist" value={buyerStats.wishlist} icon={Heart} />
      </div>

      {/* Spend + purchases */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Spending</CardTitle></CardHeader>
          <CardContent><SpendAreaChart data={buyerSpendSeries} /></CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent purchases</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/buyer/purchases">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {buyerPurchases.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center gap-4 rounded-xl border border-border p-3">
                <span className={cn('size-11 shrink-0 rounded-lg bg-gradient-to-br', o.product.gradient)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/product/${o.product.id}`} className="truncate text-sm font-medium hover:text-primary">{o.product.title}</Link>
                    <Badge variant={statusVariant[o.status]} className="shrink-0">{o.status}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Key className="size-3" /> <span className="font-mono">{o.licenseKey}</span> · {o.license}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold">{o.amount === 0 ? 'Free' : `$${o.amount}`}</div>
                  <div className="text-xs text-muted-foreground">{o.date}</div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0"><Download className="size-4" /> <span className="hidden sm:inline">Download</span></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Wishlist */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>From your wishlist</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/buyer/wishlist">View all <ArrowRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {buyerWishlist.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40">
                <span className={cn('size-12 shrink-0 rounded-lg bg-gradient-to-br', p.gradient)} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium group-hover:text-primary">{p.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-amber-400 text-amber-400" /> {p.rating} · {p.price === 0 ? 'Free' : `$${p.price}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">Recommended for you</h2>
          <Button variant="ghost" size="sm" asChild><Link href="/products">Explore <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {buyerRecommended.map((p) => <ProductCard key={p.id} repo={p} />)}
        </div>
      </div>
    </div>
  )
}
