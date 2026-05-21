'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DollarSign, TrendingUp, Package, Star, Plus, BarChart3, Eye, Loader2 } from 'lucide-react'
import { formatPrice, timeAgo } from '@/lib/utils'

interface SellerStats {
  totalRevenue: number
  totalSales: number
  activeProducts: number
  avgRating: number
  recentSales: { id: string; product: string; buyer: string; amount: number; date: string }[]
}

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/seller/stats').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ])
      .then(([statsData, meData]) => {
        setStats(statsData)
        setUserName(meData?.user?.full_name ?? '')
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

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign },
    { label: 'Total Sales', value: String(stats?.totalSales ?? 0), icon: TrendingUp },
    { label: 'Active Products', value: String(stats?.activeProducts ?? 0), icon: Package },
    { label: 'Avg Rating', value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', icon: Star },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
          <p className="text-surface-400 mt-1">
            {userName ? `Welcome back, ${userName.split(' ')[0]}.` : 'Your overview.'}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Link href="/seller/new-product" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Product
          </Link>
          <Link href="/seller/analytics" className="btn-secondary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
          <Link href="/seller/products" className="btn-secondary flex items-center gap-2">
            <Eye className="w-4 h-4" /> Manage Products
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            <p className="text-surface-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
        </div>
        {(stats?.recentSales ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center text-surface-400">
            No sales yet. Start by adding a product.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Order ID', 'Product', 'Buyer', 'Amount', 'Date'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-surface-300 font-mono">{sale.id}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{sale.product}</td>
                    <td className="px-6 py-4 text-sm text-surface-300">{sale.buyer}</td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-medium">
                      {formatPrice(sale.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-400">{timeAgo(sale.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
