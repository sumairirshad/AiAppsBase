import { Download, Users, ShoppingBag, DollarSign, Star } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { GrowthAreaChart, RevenueAreaChart, CategoryDonut } from '@/components/dashboard/charts'
import {
  getAdminDashboardStats, getAdminGrowthSeries, getAdminRevenueSeries, getOrderStatusDistribution,
} from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const [stats, growth, revenue, statusDist] = await Promise.all([
    getAdminDashboardStats(), getAdminGrowthSeries(), getAdminRevenueSeries(), getOrderStatusDistribution(),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHead title="Reports" description="Revenue, user, and booking reports across the platform." />
        <Button variant="outline" asChild>
          <a href="/api/admin/reports/export"><Download className="size-4" /> Export bookings CSV</a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={stats.totalRevenue} prefix="$" icon={DollarSign} />
        <StatCard label="Total bookings" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Total reviews" value={stats.totalReviews} icon={Star} />
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue report</CardTitle></CardHeader>
        <CardContent>
          {revenue.some((r) => r.revenue > 0)
            ? <RevenueAreaChart data={revenue} />
            : <EmptyState icon="DollarSign" title="No revenue yet" description="Revenue reporting appears after completed bookings." className="border-0" />}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>User &amp; provider report</CardTitle></CardHeader>
          <CardContent>
            {growth.length > 0
              ? <GrowthAreaChart data={growth} series={[{ key: 'users', label: 'Users' }, { key: 'sellers', label: 'Providers' }]} />
              : <EmptyState icon="Users" title="No data yet" description="User reporting appears as signups happen." className="border-0" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Booking report</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length > 0
              ? <CategoryDonut data={statusDist} valueSuffix="" />
              : <EmptyState icon="ShoppingBag" title="No bookings yet" description="Status breakdown appears after the first booking." className="border-0" />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
