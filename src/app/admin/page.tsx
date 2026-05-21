'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DollarSign, Users, Package, TrendingUp, ShoppingCart, ArrowRight,
  UserPlus, Star, FileCheck, Loader2,
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  gmv: number
  totalSales: number
  platformRevenue: number
  pendingProducts: number
}

interface Activity {
  type: string
  id: string
  context: string
  actor: string
  ts: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? null)
        setActivity(data.activity ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  const kpis = [
    { label: 'GMV', value: `$${formatNumber(stats?.gmv ?? 0)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Total Users', value: formatNumber(stats?.totalUsers ?? 0), icon: Users, color: 'text-brand-400' },
    { label: 'Active Sellers', value: formatNumber(stats?.totalSellers ?? 0), icon: ShoppingCart, color: 'text-purple-400' },
    { label: 'Platform Revenue', value: `$${formatNumber(stats?.platformRevenue ?? 0)}`, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Pending Review', value: String(stats?.pendingProducts ?? 0), icon: UserPlus, color: 'text-cyan-400' },
  ]

  const quickActions = [
    { label: 'Product Review Queue', description: 'Review pending submissions', href: '/admin/products', icon: Package, color: 'text-brand-400 bg-brand-500/10' },
    { label: 'User Management', description: 'Manage users and roles', href: '/admin/users', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Financial Overview', description: 'Revenue and payouts', href: '/admin/finances', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
  ]

  const activityIcon: Record<string, typeof Package> = {
    order: ShoppingCart,
    submission: Package,
    review: Star,
    approved: FileCheck,
  }

  const activityColor: Record<string, string> = {
    order: 'text-emerald-400 bg-emerald-500/10',
    submission: 'text-brand-400 bg-brand-500/10',
    review: 'text-amber-400 bg-amber-500/10',
    approved: 'text-green-400 bg-green-500/10',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-surface-400">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-400 text-xs">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold text-white mb-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-surface-400 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((item, i) => {
                const Icon = activityIcon[item.type] ?? Package
                const color = activityColor[item.type] ?? 'text-brand-400 bg-brand-500/10'
                const label =
                  item.type === 'order'
                    ? `Purchase: ${item.context} by ${item.actor}`
                    : `Submission: ${item.context} by ${item.actor}`
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white">{label}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{new Date(item.ts).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors">{action.label}</h3>
                    <p className="text-xs text-surface-400">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-500 group-hover:text-brand-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
