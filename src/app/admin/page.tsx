'use client'

import Link from 'next/link'
import { DollarSign, Users, Package, TrendingUp, ShoppingCart, ArrowRight, UserPlus, Star, FileCheck } from 'lucide-react'
import { mockDashboardStats } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

const kpis = [
  { label: 'GMV', value: `$${formatNumber(mockDashboardStats.totalRevenue)}`, change: `+${mockDashboardStats.revenueChange}%`, icon: DollarSign, color: 'text-emerald-400' },
  { label: 'Total Users', value: formatNumber(mockDashboardStats.totalUsers), change: '+5.2%', icon: Users, color: 'text-brand-400' },
  { label: 'Active Sellers', value: formatNumber(Math.floor(mockDashboardStats.totalUsers * 0.12)), change: '+3.1%', icon: ShoppingCart, color: 'text-purple-400' },
  { label: 'Platform Revenue', value: `$${formatNumber(Math.floor(mockDashboardStats.totalRevenue * 0.15))}`, change: `+${mockDashboardStats.revenueChange}%`, icon: TrendingUp, color: 'text-amber-400' },
  { label: 'New Signups', value: '342', change: '+18.7%', icon: UserPlus, color: 'text-cyan-400' },
]

const activityFeed = [
  { id: '1', type: 'submission', message: 'New product submitted: "AI Code Reviewer Pro"', time: '12 minutes ago', icon: Package, color: 'text-brand-400 bg-brand-500/10' },
  { id: '2', type: 'purchase', message: 'Purchase completed: SaaS Dashboard Pro by Emma Davis', time: '28 minutes ago', icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
  { id: '3', type: 'review', message: 'New 5-star review on AI Chat Interface', time: '1 hour ago', icon: Star, color: 'text-amber-400 bg-amber-500/10' },
  { id: '4', type: 'submission', message: 'Product approved: "React Component Kit"', time: '2 hours ago', icon: FileCheck, color: 'text-green-400 bg-green-500/10' },
  { id: '5', type: 'purchase', message: 'Purchase completed: E-Commerce Starter Kit by John Doe', time: '3 hours ago', icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
  { id: '6', type: 'submission', message: 'New product submitted: "Vue Dashboard Template"', time: '4 hours ago', icon: Package, color: 'text-brand-400 bg-brand-500/10' },
]

const quickActions = [
  { label: 'Product Review Queue', description: 'Review pending submissions', href: '/admin/products', icon: Package, color: 'text-brand-400 bg-brand-500/10' },
  { label: 'User Management', description: 'Manage users and roles', href: '/admin/users', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
  { label: 'Financial Overview', description: 'Revenue and payouts', href: '/admin/finances', icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
]

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-surface-400">Platform overview and management.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-400 text-xs">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold text-white mb-1">{kpi.value}</p>
            <span className="text-xs text-emerald-400">{kpi.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
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
