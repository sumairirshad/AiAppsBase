'use client'

import Link from 'next/link'
import { DollarSign, TrendingUp, Package, Star, Plus, BarChart3, Eye } from 'lucide-react'
import { mockProducts, mockOrders } from '@/lib/mock-data'
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils'

const stats = [
  {
    label: 'Total Revenue',
    value: '$12,458.00',
    change: +18.2,
    icon: DollarSign,
  },
  {
    label: 'Total Sales',
    value: '2,143',
    change: +12.5,
    icon: TrendingUp,
  },
  {
    label: 'Active Products',
    value: '24',
    change: +4.1,
    icon: Package,
  },
  {
    label: 'Avg Rating',
    value: '4.8',
    change: -0.2,
    icon: Star,
  },
]

const recentSales = [
  { id: 'ORD-1042', product: 'SaaS Dashboard Pro', buyer: 'Emma Davis', amount: 49, date: '2025-03-15T10:30:00Z' },
  { id: 'ORD-1041', product: 'AI Chat Interface', buyer: 'John Park', amount: 39, date: '2025-03-14T15:20:00Z' },
  { id: 'ORD-1040', product: 'Mobile Fitness Tracker', buyer: 'Lisa Chen', amount: 89, date: '2025-03-13T09:10:00Z' },
  { id: 'ORD-1039', product: 'SaaS Dashboard Pro', buyer: 'Mark Wilson', amount: 49, date: '2025-03-12T14:45:00Z' },
  { id: 'ORD-1038', product: 'AI Chat Interface', buyer: 'Anna Lee', amount: 39, date: '2025-03-11T11:00:00Z' },
]

export default function SellerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
          <p className="text-surface-400 mt-1">Welcome back, Alex. Here&apos;s your overview.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Link href="/seller/new-product" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
          <Link href="/seller/analytics" className="btn-secondary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Link>
          <Link href="/seller/products" className="btn-secondary flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Manage Products
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-brand-400" />
              </div>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <TrendingUp
                  className={`w-3.5 h-3.5 ${stat.change < 0 ? 'rotate-180' : ''}`}
                />
                {stat.change >= 0 ? '+' : ''}
                {stat.change}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            <p className="text-surface-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                  Order ID
                </th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                  Product
                </th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                  Buyer
                </th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-surface-300 font-mono">{sale.id}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{sale.product}</td>
                  <td className="px-6 py-4 text-sm text-surface-300">{sale.buyer}</td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                    ${sale.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-400">{timeAgo(sale.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
