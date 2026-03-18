'use client'

import { DollarSign, TrendingUp, CreditCard, Percent, ArrowUpRight } from 'lucide-react'
import { mockOrders, mockDashboardStats } from '@/lib/mock-data'
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils'

const COMMISSION_RATE = 0.15

const revenueCards = [
  {
    label: 'Total GMV',
    value: `$${formatNumber(mockDashboardStats.totalRevenue)}`,
    change: `+${mockDashboardStats.revenueChange}%`,
    icon: DollarSign,
    color: 'text-emerald-400',
  },
  {
    label: 'Platform Commission',
    value: `$${formatNumber(Math.floor(mockDashboardStats.totalRevenue * COMMISSION_RATE))}`,
    change: `+${mockDashboardStats.revenueChange}%`,
    icon: TrendingUp,
    color: 'text-brand-400',
  },
  {
    label: 'Total Transactions',
    value: formatNumber(mockDashboardStats.totalSales),
    change: `+${mockDashboardStats.salesChange}%`,
    icon: CreditCard,
    color: 'text-purple-400',
  },
  {
    label: 'Commission Rate',
    value: `${(COMMISSION_RATE * 100).toFixed(0)}%`,
    change: 'Fixed',
    icon: Percent,
    color: 'text-amber-400',
  },
]

const mockPayouts = [
  { id: 'PAY-001', seller: 'Alex Chen', amount: 8420, status: 'completed', date: '2025-03-10T10:00:00Z' },
  { id: 'PAY-002', seller: 'Sarah Kim', amount: 5640, status: 'pending', date: '2025-03-14T12:00:00Z' },
  { id: 'PAY-003', seller: 'James Miller', amount: 2310, status: 'pending', date: '2025-03-15T09:00:00Z' },
]

export default function AdminFinancesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Financial Management</h1>
        <p className="text-surface-400">Revenue overview, transactions, and payout management.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {revenueCards.map((card) => (
          <div key={card.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-400 text-xs">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-white mb-1">{card.value}</p>
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              {card.change !== 'Fixed' && <ArrowUpRight className="w-3 h-3" />}
              {card.change}
            </span>
          </div>
        ))}
      </div>

      {/* Transaction Ledger */}
      <div className="glass rounded-xl overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Transaction Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Seller
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Commission
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockOrders.map((order) => {
                const commission = order.amount * COMMISSION_RATE
                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-surface-300 font-mono">{order.id}</td>
                    <td className="p-4 text-sm text-surface-300">Emma Davis</td>
                    <td className="p-4 text-sm text-surface-300">{order.product.seller.name}</td>
                    <td className="p-4 text-sm text-white font-medium">{order.product.title}</td>
                    <td className="p-4 text-sm text-white font-medium">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="p-4 text-sm text-emerald-400 font-medium">
                      {formatPrice(commission)}
                    </td>
                    <td className="p-4 text-sm text-surface-400">{timeAgo(order.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Management */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Payout Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Payout ID
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Seller
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm text-surface-300 font-mono">{payout.id}</td>
                  <td className="p-4 text-sm text-white">{payout.seller}</td>
                  <td className="p-4 text-sm text-white font-medium">
                    {formatPrice(payout.amount)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`badge border text-xs ${
                        payout.status === 'completed'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {payout.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-surface-400">{timeAgo(payout.date)}</td>
                  <td className="p-4">
                    {payout.status === 'pending' && (
                      <button className="btn-primary text-xs px-3 py-1.5">
                        Process Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
