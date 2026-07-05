import Link from 'next/link'
import {
  DollarSign, ShoppingBag, Package, Users, PlusCircle, ArrowRight, Wallet,
  TrendingUp, Star,
} from 'lucide-react'

import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { RevenueAreaChart, SalesBarChart, CategoryDonut } from '@/components/dashboard/charts'
import {
  currentSeller, sellerStats, sellerRevenueSeries, sellerCategorySplit,
  sellerTopProducts, sellerRecentOrders,
} from '@/lib/dashboard-data'

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  completed: 'success', pending: 'warning', refunded: 'destructive',
}

export default function SellerDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {currentSeller.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">Here&apos;s how your store is performing today.</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/panel/seller/add-product"><PlusCircle className="size-4" /> Add product</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={sellerStats.revenue} prefix="$" change={sellerStats.revenueChange} icon={DollarSign} />
        <StatCard label="Total sales" value={sellerStats.sales} change={sellerStats.salesChange} icon={ShoppingBag} />
        <StatCard label="Products" value={sellerStats.products} change={sellerStats.productsChange} icon={Package} />
        <StatCard label="Followers" value={sellerStats.followers} change={sellerStats.followersChange} icon={Users} />
      </div>

      {/* Revenue + category */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Revenue</CardTitle>
              <p className="text-sm text-muted-foreground">Last 9 months</p>
            </div>
            <Badge variant="success"><TrendingUp className="size-3" /> +{sellerStats.revenueChange}%</Badge>
          </CardHeader>
          <CardContent><RevenueAreaChart data={sellerRevenueSeries} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sales by category</CardTitle></CardHeader>
          <CardContent><CategoryDonut data={sellerCategorySplit} /></CardContent>
        </Card>
      </div>

      {/* Sales bar + payout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Units sold</CardTitle></CardHeader>
          <CardContent><SalesBarChart data={sellerRevenueSeries} /></CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader><CardTitle>Wallet</CardTitle></CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Available balance</div>
              <div className="font-display text-3xl font-bold">${sellerStats.payout.toLocaleString()}</div>
              <div className="mt-1 text-xs text-muted-foreground">${sellerStats.pending.toLocaleString()} pending clearance</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Star className="size-4 text-amber-400" /> Avg. rating</span>
                <span className="font-semibold">{sellerStats.avgRating}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="size-4 text-success" /> Conversion</span>
                <span className="font-semibold">{sellerStats.conversion}%</span>
              </div>
              <Button className="w-full"><Wallet className="size-4" /> Withdraw funds</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Top products</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/panel/seller/products">View all <ArrowRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Sales</th>
                  <th className="px-6 py-3 font-medium">Revenue</th>
                  <th className="px-6 py-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sellerTopProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn('size-9 rounded-lg bg-gradient-to-br', p.gradient)} />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{p.price === 0 ? 'Free' : `$${p.price}`}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatNumber(p.sales)}</td>
                    <td className="px-6 py-3 font-medium">${formatNumber(p.revenue)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {p.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent orders</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/panel/orders">View all <ArrowRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {sellerRecentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-3 font-mono text-xs">{o.id}</td>
                    <td className="px-6 py-3">{o.product}</td>
                    <td className="px-6 py-3 text-muted-foreground">{o.buyer}</td>
                    <td className="px-6 py-3 font-medium">${o.amount}</td>
                    <td className="px-6 py-3"><Badge variant={statusVariant[o.status]}>{o.status}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
