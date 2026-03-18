'use client'

import Link from 'next/link'
import { ArrowLeft, DollarSign, TrendingUp, ShoppingCart, Eye, Star, BarChart3 } from 'lucide-react'
import { mockProducts, mockReviews } from '@/lib/mock-data'
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils'

const stats = [
  { label: 'Total Revenue', value: '$12,458.00', change: +18.2, icon: DollarSign },
  { label: 'Total Sales', value: '2,143', change: +12.5, icon: ShoppingCart },
  { label: 'Page Views', value: '18.4K', change: +24.7, icon: Eye },
  { label: 'Conversion Rate', value: '3.2%', change: -1.1, icon: TrendingUp },
]

const topProducts = mockProducts.slice(0, 5).map((p) => ({
  id: p.id,
  title: p.title,
  sales: p.salesCount,
  revenue: p.price * p.salesCount,
  rating: p.rating,
}))

export default function SellerAnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/seller"
        className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-surface-400 mt-1">Track your performance and sales metrics.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <select className="input-field text-sm py-2 px-3">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      {/* Stats Overview Cards */}
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

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-400" />
              Revenue Chart
            </h2>
          </div>
          <div className="p-6 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="flex items-end justify-center gap-2 mb-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div
                    key={i}
                    className="w-4 rounded-t bg-gradient-to-t from-brand-600 to-brand-400 opacity-80"
                    style={{ height: `${h * 1.8}px` }}
                  />
                ))}
              </div>
              <p className="text-surface-500 text-sm">Monthly revenue overview</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Sales Chart
            </h2>
          </div>
          <div className="p-6 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="flex items-end justify-center gap-2 mb-4">
                {[30, 50, 40, 70, 45, 75, 60, 80, 55, 85, 65, 78].map((h, i) => (
                  <div
                    key={i}
                    className="w-4 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80"
                    style={{ height: `${h * 1.8}px` }}
                  />
                ))}
              </div>
              <p className="text-surface-500 text-sm">Monthly sales overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Top Products</h2>
          </div>
          <div className="divide-y divide-white/5">
            {topProducts.map((product, index) => (
              <div key={product.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <span className="text-surface-500 font-mono text-sm w-6">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium truncate">{product.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-surface-400 text-xs">{formatNumber(product.sales)} sales</span>
                    <span className="text-surface-600">|</span>
                    <span className="text-emerald-400 text-xs font-medium">{formatPrice(product.revenue)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-sm font-medium">{product.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-white/5">
            {mockReviews.map((review) => (
              <div key={review.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{review.user.name}</span>
                    {review.verified && (
                      <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-surface-500 text-xs">{timeAgo(review.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-surface-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-surface-300 text-sm line-clamp-2">{review.comment}</p>
              </div>
            ))}

            {mockReviews.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-surface-500 text-sm">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
