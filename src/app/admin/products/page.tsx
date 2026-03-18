'use client'

import { useState } from 'react'
import { Package, CheckCircle, XCircle, AlertCircle, Clock, Filter } from 'lucide-react'
import { mockProducts } from '@/lib/mock-data'
import { formatPrice, timeAgo } from '@/lib/utils'
import { Product, ProductStatus } from '@/types'

type TabKey = 'all' | 'pending' | 'approved' | 'rejected'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const statusConfig: Record<ProductStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  suspended: { label: 'Suspended', icon: AlertCircle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
}

// Add some pending/rejected products for the admin view
const allProducts: Product[] = [
  ...mockProducts,
  {
    ...mockProducts[0],
    id: 'p-10',
    title: 'AI Code Reviewer Pro',
    status: 'pending',
    createdAt: '2025-03-15T09:00:00Z',
    seller: mockProducts[1].seller,
  },
  {
    ...mockProducts[1],
    id: 'p-11',
    title: 'Vue Dashboard Template',
    status: 'pending',
    createdAt: '2025-03-14T14:00:00Z',
    seller: mockProducts[2].seller,
  },
  {
    ...mockProducts[2],
    id: 'p-12',
    title: 'Crypto Tracker Widget',
    status: 'rejected',
    createdAt: '2025-03-10T11:00:00Z',
    seller: mockProducts[0].seller,
  },
]

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = activeTab === 'all'
    ? allProducts
    : allProducts.filter((p) => p.status === activeTab)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Product Management</h1>
          <p className="text-surface-400">Review submissions and manage product listings.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <Filter className="w-4 h-4" />
          {allProducts.filter((p) => p.status === 'pending').length} pending review
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-lg w-fit">
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? allProducts.length : allProducts.filter((p) => p.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 glass rounded-lg">
          <span className="text-sm text-surface-400">{selectedIds.size} selected</span>
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approve
          </button>
          <button className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}

      {/* Product Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Product</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Seller</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Category</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Price</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((product) => {
                const status = statusConfig[product.status]
                const StatusIcon = status.icon
                return (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600/20 to-purple-600/20 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-brand-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{product.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-surface-300">{product.seller.name}</td>
                    <td className="p-4 text-sm text-surface-400">{product.category}</td>
                    <td className="p-4 text-sm text-white font-medium">{formatPrice(product.price)}</td>
                    <td className="p-4 text-sm text-surface-400">{timeAgo(product.createdAt)}</td>
                    <td className="p-4">
                      <span className={`badge border text-xs flex items-center gap-1 w-fit ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {product.status === 'pending' && (
                          <>
                            <button className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        <button className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Changes
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
