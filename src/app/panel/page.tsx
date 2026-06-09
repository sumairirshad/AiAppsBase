'use client'

import React, { useEffect, useState } from 'react'
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Star,
  PlusCircle,
  Package,
  Loader2,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice, timeAgo } from '@/lib/utils'

interface SellerStats {
  totalRevenue: number
  totalSales: number
  activeProducts: number
  avgRating: number
  recentSales: {
    id: string
    product: string
    buyer: string
    amount: number
    date: string
  }[]
}

export default function PanelPage() {
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/seller/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
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
    {
      label: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Sales',
      value: String(stats?.totalSales ?? 0),
      icon: ShoppingBag,
      color: 'text-brand-400',
    },
    {
      label: 'Active Products',
      value: String(stats?.activeProducts ?? 0),
      icon: Package,
      color: 'text-blue-400',
    },
    {
      label: 'Avg Rating',
      value: stats?.avgRating ? `${stats.avgRating} ★` : 'N/A',
      icon: Star,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-surface-400 text-sm">Welcome back! Here&apos;s your store performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-surface-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
            <Link href="/panel/seller/products" className="text-sm text-brand-400 hover:text-brand-300">
              View Products
            </Link>
          </div>

          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            {!stats?.recentSales?.length ? (
              <div className="p-10 text-center">
                <TrendingUp className="w-8 h-8 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400 text-sm">No sales yet. Get your first product approved!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {stats.recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white line-clamp-1">{sale.product}</p>
                        <p className="text-xs text-surface-500">
                          by {sale.buyer} • {timeAgo(sale.date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 shrink-0 ml-4">
                      {formatPrice(sale.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link
              href="/panel/seller/add-product"
              className="glass p-4 rounded-2xl border border-white/5 hover:border-brand-500/50 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                <PlusCircle className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Add New Product</p>
                <p className="text-xs text-surface-500">List a new AI-built app</p>
              </div>
            </Link>

            <Link
              href="/panel/seller/products"
              className="glass p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Package className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">My Products</p>
                <p className="text-xs text-surface-500">Manage your listings</p>
              </div>
            </Link>

            <Link
              href="/buyer/purchases"
              className="glass p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Clock className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Order History</p>
                <p className="text-xs text-surface-500">View your purchases</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
