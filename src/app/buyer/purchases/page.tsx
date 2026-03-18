'use client'

import { useState } from 'react'
import { Package, Download, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { mockOrders } from '@/lib/mock-data'
import { formatPrice, timeAgo } from '@/lib/utils'

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  refunded: { label: 'Refunded', icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  disputed: { label: 'Disputed', icon: AlertCircle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

export default function PurchasesPage() {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  const toggleKeyReveal = (orderId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const maskKey = (key: string) => {
    const parts = key.split('-')
    return parts[0] + '-****-****-' + parts[3]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Purchase History</h1>
        <p className="text-surface-400">All your purchases, license keys, and downloads.</p>
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {mockOrders.map((order) => {
          const status = statusConfig[order.status]
          const StatusIcon = status.icon
          const isRevealed = revealedKeys.has(order.id)

          return (
            <div key={order.id} className="glass rounded-xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Product Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-600/20 to-purple-600/20 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-brand-400" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-white font-semibold">{order.product.title}</h3>
                    <p className="text-xs text-surface-400">
                      Order {order.id} &middot; {timeAgo(order.createdAt)} &middot; {order.licenseType} License
                    </p>

                    {/* License Key */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-surface-500">License:</span>
                      <code className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                        {isRevealed ? order.licenseKey : maskKey(order.licenseKey)}
                      </code>
                      <button
                        onClick={() => toggleKeyReveal(order.id)}
                        className="text-surface-400 hover:text-white transition-colors"
                        title={isRevealed ? 'Hide key' : 'Reveal key'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price, Status, Actions */}
                <div className="flex items-center gap-4 lg:gap-6">
                  <span className="text-lg font-bold text-white">{formatPrice(order.amount)}</span>

                  <span className={`badge border text-xs flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>

                  <button className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {mockOrders.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No purchases yet</h3>
          <p className="text-surface-400">Browse the marketplace to find your first product.</p>
        </div>
      )}
    </div>
  )
}
