'use client'

import { useEffect, useState } from 'react'
import { Package, CheckCircle, XCircle, AlertCircle, Clock, Filter, Loader2 } from 'lucide-react'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { ProductStatus } from '@/types'

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

interface AdminProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  status: ProductStatus
  createdAt: string
  seller: { id: string; name: string; email: string }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeTab === 'all' ? products : products.filter((p) => p.status === activeTab)

  const updateStatus = async (id: string, status: ProductStatus) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      }
    } finally {
      setUpdating(null)
    }
  }

  const bulkUpdate = async (status: ProductStatus) => {
    for (const id of selectedIds) {
      await updateStatus(id, status)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((p) => p.id)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Product Management</h1>
          <p className="text-surface-400">Review submissions and manage product listings.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <Filter className="w-4 h-4" />
          {products.filter((p) => p.status === 'pending').length} pending review
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 glass rounded-lg w-fit">
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? products.length : products.filter((p) => p.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 glass rounded-lg">
          <span className="text-sm text-surface-400">{selectedIds.size} selected</span>
          <button
            onClick={() => bulkUpdate('approved')}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" /> Approve
          </button>
          <button
            onClick={() => bulkUpdate('rejected')}
            className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </div>
      )}

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
                    className="rounded border-surface-600 bg-surface-800 text-brand-500"
                  />
                </th>
                {['Product', 'Seller', 'Category', 'Price', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="p-4 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((product) => {
                const status = statusConfig[product.status]
                const StatusIcon = status.icon
                const isUpdating = updating === product.id
                return (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-surface-600 bg-surface-800 text-brand-500"
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
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                        ) : (
                          <>
                            {product.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(product.id, 'approved')}
                                  className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => updateStatus(product.id, 'rejected')}
                                  className="text-xs px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {product.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(product.id, 'suspended')}
                                className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" /> Suspend
                              </button>
                            )}
                            {(product.status === 'rejected' || product.status === 'suspended') && (
                              <button
                                onClick={() => updateStatus(product.id, 'approved')}
                                className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-surface-400">No products found.</div>
        )}
      </div>
    </div>
  )
}
