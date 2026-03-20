'use client'

import React from 'react'
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  Package,
  Clock,
  PlusCircle,
  Settings
} from 'lucide-react'
import Link from 'next/link'

const STATS = [
  { label: 'Total Sales', value: '$12,450', change: '+12.5%', icon: DollarSign, color: 'text-emerald-400' },
  { label: 'Active Products', value: '24', change: '+2', icon: Package, color: 'text-blue-400' },
  { label: 'Total Customers', value: '840', change: '+18.2%', icon: Users, color: 'text-purple-400' },
  { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', icon: TrendingUp, color: 'text-amber-400' },
]

const RECENT_ACTIVITY = [
  { id: 1, type: 'sale', product: 'SaaS Dashboard Pro', user: 'alex_dev', amount: '$49.00', time: '2 mins ago' },
  { id: 2, type: 'review', product: 'AI Image Generator', user: 'sarah_k', rating: 5, time: '1 hour ago' },
  { id: 3, type: 'sale', product: 'Next.js Landing Template', user: 'mike_j', amount: '$29.00', time: '3 hours ago' },
  { id: 4, type: 'new_product', product: 'Portfolio Kit', user: 'You', status: 'Pending Approval', time: '5 hours ago' },
]

export default function PanelPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-surface-400 text-sm">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-surface-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-brand-400 hover:text-brand-300">View All</button>
          </div>
          
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      {activity.type === 'sale' ? <ShoppingBag className="w-4 h-4 text-emerald-400" /> : 
                       activity.type === 'review' ? <ArrowUpRight className="w-4 h-4 text-blue-400" /> :
                       <Clock className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {activity.type === 'sale' ? `New sale: ${activity.product}` :
                         activity.type === 'review' ? `New review for ${activity.product}` :
                         `Product submitted: ${activity.product}`}
                      </p>
                      <p className="text-xs text-surface-500">by {activity.user} • {activity.time}</p>
                    </div>
                  </div>
                  {activity.amount && <span className="text-sm font-semibold text-white">{activity.amount}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
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
              href="/panel/settings" 
              className="glass p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Store Settings</p>
                <p className="text-xs text-surface-500">Manage your seller profile</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
