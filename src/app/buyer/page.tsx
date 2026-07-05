import Link from 'next/link'
import {
  ShoppingBag, DollarSign, Download, Heart, ArrowRight, Key, Star,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SpendAreaChart } from '@/components/dashboard/charts'
import { ProductCard } from '@/components/marketplace/product-card'
import {
  getCurrentUser, getBuyerStats, getBuyerOrders, getBuyerWishlist, getBuyerSpendSeries,
} from '@/lib/dashboard'
import { listApprovedProducts } from '@/lib/products'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning'> = {
  completed: 'success', refunded: 'destructive', disputed: 'warning',
}

export const dynamic = 'force-dynamic'

export default async function BuyerDashboard() {
  const user = await getCurrentUser()
  const uid = user?.id ?? ''
  const [stats, purchases, wishlist, spend, allProducts] = await Promise.all([
    getBuyerStats(uid), getBuyerOrders(uid, 5), getBuyerWishlist(uid), getBuyerSpendSeries(uid),
    listApprovedProducts(),
  ])
  const recommended = allProducts.filter((p) => p.featured).slice(0, 3)
  const recos = recommended.length ? recommended : allProducts.slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {user ? `Welcome, ${user.full_name.split(' ')[0]}` : 'Your dashboard'}
        </h1>
        <p className="text-muted-foreground">Manage your purchases, downloads, licenses, and wishlist.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Purchases" value={stats.purchases} icon={ShoppingBag} />
        <StatCard label="Total spent" value={stats.spent} prefix="$" icon={DollarSign} />
        <StatCard label="Downloads" value={stats.downloads} icon={Download} />
        <StatCard label="Wishlist" value={stats.wishlist} icon={Heart} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Spending</CardTitle></CardHeader>
          <CardContent>
            {spend.length > 0
              ? <SpendAreaChart data={spend} />
              : <EmptyState icon="DollarSign" title="No spending yet" description="Your spending trend appears after your first purchase." className="border-0" />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent purchases</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/buyer/purchases">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchases.length === 0 ? (
              <EmptyState icon="ShoppingBag" title="No purchases yet" description="Browse the marketplace to find your next project." actionLabel="Browse marketplace" actionHref="/products" className="border-0" />
            ) : purchases.map((o) => (
              <div key={o.id} className="flex items-center gap-4 rounded-xl border border-border p-3">
                <span className={cn('size-11 shrink-0 rounded-lg bg-gradient-to-br', o.gradient)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/product/${o.productId}`} className="truncate text-sm font-medium hover:text-primary">{o.product}</Link>
                    <Badge variant={statusVariant[o.status] ?? 'muted'} className="shrink-0">{o.status}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Key className="size-3" /> <span className="font-mono">{o.licenseKey?.slice(0, 18)}</span> · {o.license}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold">{o.amount === 0 ? 'Free' : `$${o.amount}`}</div>
                  <div className="text-xs text-muted-foreground">{o.date}</div>
                </div>
                {o.downloadable && (
                  <Button size="sm" variant="outline" className="shrink-0" asChild>
                    <a href={`/api/orders/${o.id}/download`}><Download className="size-4" /> <span className="hidden sm:inline">Download</span></a>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {wishlist.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>From your wishlist</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/buyer/wishlist">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {wishlist.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40">
                  <span className={cn('size-12 shrink-0 rounded-lg bg-gradient-to-br', p.gradient)} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium group-hover:text-primary">{p.title}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" /> {p.rating || '—'} · {p.price === 0 ? 'Free' : `$${p.price}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recos.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight">Recommended for you</h2>
            <Button variant="ghost" size="sm" asChild><Link href="/products">Explore <ArrowRight className="size-4" /></Link></Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recos.map((p) => <ProductCard key={p.id} repo={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
