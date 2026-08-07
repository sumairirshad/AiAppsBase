import Link from 'next/link'
import {
  Users, Store, UserCheck, Clock, ShieldAlert, ShieldX, Ban, UserPlus,
  ShoppingBag, CheckCircle, RotateCcw, DollarSign, ArrowRight, Package, Star,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { PageHead } from '@/components/dashboard/page-head'
import { EmptyState } from '@/components/dashboard/empty-state'
import { GrowthAreaChart, RevenueAreaChart, CategoryDonut } from '@/components/dashboard/charts'
import {
  getAdminDashboardStats, getAdminGrowthSeries, getAdminRevenueSeries,
  getOrderStatusDistribution, getAdminRecentActivity, getLatestReviews, getSystemHealth,
} from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

const activityLabel: Record<string, (a: { context: string; actor: string }) => string> = {
  order: (a) => `Purchase: ${a.context} by ${a.actor}`,
  submission: (a) => `Submission: ${a.context} by ${a.actor}`,
  signup: (a) => `New signup: ${a.actor} (${a.context})`,
}

export default async function AdminDashboard() {
  const [stats, growth, revenue, statusDist, activity, reviews, health] = await Promise.all([
    getAdminDashboardStats(), getAdminGrowthSeries(), getAdminRevenueSeries(),
    getOrderStatusDistribution(), getAdminRecentActivity(8), getLatestReviews(5), getSystemHealth(),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHead title="Admin Dashboard" description="Platform-wide overview of users, sellers, and bookings." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Total providers" value={stats.totalSellers} icon={Store} />
        <StatCard label="Active providers" value={stats.activeSellers} icon={UserCheck} />
        <StatCard label="Pending approvals" value={stats.pendingSellerApprovals} icon={Clock} />
        <StatCard label="Suspended users" value={stats.suspendedUsers} icon={ShieldAlert} />
        <StatCard label="Blocked users" value={stats.blockedUsers} icon={ShieldX} />
        <StatCard label="Banned users" value={stats.bannedUsers} icon={Ban} />
        <StatCard label="Recent signups (7d)" value={stats.recentSignups} icon={UserPlus} />
        <StatCard label="Total bookings" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard label="Completed bookings" value={stats.completedOrders} icon={CheckCircle} />
        <StatCard label="Refunded / disputed" value={stats.refundedOrders + stats.disputedOrders} icon={RotateCcw} />
        <StatCard label="Total revenue" value={stats.totalRevenue} prefix="$" icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>User &amp; provider growth</CardTitle></CardHeader>
          <CardContent>
            {growth.length > 0
              ? <GrowthAreaChart data={growth} series={[{ key: 'users', label: 'Users' }, { key: 'sellers', label: 'Providers' }]} />
              : <EmptyState icon="BarChart3" title="No data yet" description="Growth trends appear as users sign up." className="border-0" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Booking status</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length > 0
              ? <CategoryDonut data={statusDist} valueSuffix="" />
              : <EmptyState icon="ShoppingBag" title="No bookings yet" description="Status breakdown appears after the first booking." className="border-0" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
          <CardContent>
            {revenue.some((r) => r.revenue > 0)
              ? <RevenueAreaChart data={revenue} />
              : <EmptyState icon="DollarSign" title="No revenue yet" description="Revenue trends appear after completed bookings." className="border-0" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>System health</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database</span>
              <Badge variant={health.dbOk ? 'success' : 'destructive'}>{health.dbOk ? 'Operational' : 'Unreachable'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">DB latency</span>
              <span className="font-medium">{health.dbLatencyMs}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending products</span>
              <span className="font-medium">{health.pendingProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending providers</span>
              <span className="font-medium">{health.pendingSellers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState icon="Activity" title="No recent activity" description="New signups, submissions, and orders show up here." className="border-0" />
            ) : (
              <div className="space-y-1">
                {activity.map((item, i) => {
                  const Icon = item.type === 'order' ? ShoppingBag : item.type === 'signup' ? UserPlus : Package
                  const label = (activityLabel[item.type] ?? activityLabel.submission)(item)
                  return (
                    <div key={`${item.type}-${item.id}-${i}`} className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{new Date(item.ts).toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Latest reviews</CardTitle>
            <Link href="/admin/reviews" className="text-xs text-muted-foreground hover:text-primary">
              View all <ArrowRight className="inline size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <EmptyState icon="Star" title="No reviews yet" description="Reviews across the platform appear here." className="border-0" />
            ) : (
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="mt-1.5 truncate text-muted-foreground">&ldquo;{r.comment}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.author} on {r.product}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
