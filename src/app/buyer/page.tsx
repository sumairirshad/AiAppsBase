'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, DollarSign, Key, Heart, Download, ArrowRight, ShoppingCart, Loader2 } from 'lucide-react'
import { formatPrice, timeAgo } from '@/lib/utils'

interface Order {
  id: string
  amount: number
  licenseType: string
  status: string
  createdAt: string
  product: { title: string }
}

export default function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/wishlist').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.json()),
    ])
      .then(([ordersData, wishlistData, meData]) => {
        setOrders(ordersData.orders ?? [])
        setWishlistCount(wishlistData.count ?? 0)
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

  const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0)
  const activeLicenses = orders.filter((o) => o.status === 'completed').length

  const stats = [
    { label: 'Total Purchases', value: orders.length, icon: ShoppingCart, color: 'text-brand-400' },
    { label: 'Total Spent', value: formatPrice(totalSpent), icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Active Licenses', value: activeLicenses, icon: Key, color: 'text-purple-400' },
    { label: 'Wishlist Items', value: wishlistCount, icon: Heart, color: 'text-pink-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Buyer Dashboard</h1>
        <p className="text-surface-400">
          {userName ? `Welcome, ${userName.split(' ')[0]}.` : ''} Manage your purchases, licenses, and wishlist.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-400 text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Purchases</h2>
          <Link href="/buyer/purchases" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-surface-400">
            No purchases yet.{' '}
            <Link href="/products" className="text-brand-400 hover:text-brand-300">Browse marketplace</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-600/20 to-purple-600/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{order.product.title}</h3>
                    <p className="text-xs text-surface-400">{timeAgo(order.createdAt)} &middot; {order.licenseType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{formatPrice(order.amount)}</span>
                  <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/buyer/purchases">
          <div className="glass glass-hover rounded-xl p-6 card-hover">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">My Purchases</h3>
                <p className="text-surface-400 text-sm">View all purchases, licenses & downloads</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/buyer/wishlist">
          <div className="glass glass-hover rounded-xl p-6 card-hover">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">My Wishlist</h3>
                <p className="text-surface-400 text-sm">Browse your saved products</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
