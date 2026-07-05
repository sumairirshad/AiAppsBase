import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { RevenueAreaChart, SalesBarChart, CategoryDonut } from '@/components/dashboard/charts'
import { DollarSign, ShoppingBag, Star, Users } from 'lucide-react'
import {
  getCurrentUser, getSellerStats, getSellerRevenueSeries, getSellerCategorySplit,
} from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function SellerAnalyticsPage() {
  const user = await getCurrentUser()
  const uid = user?.id ?? ''
  const [stats, revenue, category] = await Promise.all([
    getSellerStats(uid), getSellerRevenueSeries(uid), getSellerCategorySplit(uid),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHead title="Analytics" description="Traffic, conversion, and revenue insights for your store." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={stats.revenue} prefix="$" icon={DollarSign} />
        <StatCard label="Sales" value={stats.sales} icon={ShoppingBag} />
        <StatCard label="Customers" value={stats.customers} icon={Users} />
        <StatCard label="Avg. rating" value={stats.avgRating || 0} icon={Star} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue over time</CardTitle></CardHeader>
          <CardContent>
            {revenue.length > 0 ? <RevenueAreaChart data={revenue} />
              : <EmptyState icon="BarChart3" title="No data yet" description="Analytics populate as you make sales." className="border-0" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By category</CardTitle></CardHeader>
          <CardContent>
            {category.length > 0 ? <CategoryDonut data={category} />
              : <EmptyState icon="LayoutGrid" title="No data" description="Category split shows after sales." className="border-0" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Units sold</CardTitle></CardHeader>
        <CardContent>
          {revenue.length > 0 ? <SalesBarChart data={revenue} />
            : <EmptyState icon="ShoppingBag" title="No sales yet" description="Unit trends appear here." className="border-0" />}
        </CardContent>
      </Card>
    </div>
  )
}
