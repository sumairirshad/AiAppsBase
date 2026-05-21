'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, PauseCircle, Trash2, Eye, Loader2 } from 'lucide-react'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { ProductStatus } from '@/types'

interface SellerProduct {
  id: string
  title: string
  description: string
  price: number
  status: ProductStatus
  salesCount: number
  updatedAt: string
}

const statusStyles: Record<ProductStatus, string> = {
  approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  suspended: 'bg-surface-500/20 text-surface-400 border border-surface-500/30',
}

const statusLabels: Record<ProductStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.products ?? []).map((p: Record<string, unknown>) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: Number(p.price),
          status: p.status as ProductStatus,
          salesCount: 0,
          updatedAt: p.updated_at as string,
        }))
        setProducts(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Products</h1>
          <p className="text-surface-400 mt-1">Manage your listed products.</p>
        </div>
        <Link href="/seller/new-product" className="btn-primary flex items-center gap-2 mt-4 sm:mt-0">
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="glass rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 card-hover"
          >
            <div className="w-20 h-20 rounded-lg bg-surface-800 flex-shrink-0 flex items-center justify-center">
              <Eye className="w-6 h-6 text-surface-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-semibold truncate">{product.title}</h3>
                <span className={`badge ${statusStyles[product.status]}`}>
                  {statusLabels[product.status]}
                </span>
              </div>
              <p className="text-surface-400 text-sm line-clamp-1">{product.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                <span>{formatPrice(product.price)}</span>
                <span>Updated {timeAgo(product.updatedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="p-2 rounded-lg bg-surface-800/50 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-surface-800/50 hover:bg-yellow-500/20 text-surface-300 hover:text-yellow-400 transition-colors" title="Pause">
                <PauseCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="p-2 rounded-lg bg-surface-800/50 hover:bg-red-500/20 text-surface-300 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="glass rounded-xl p-12 text-center">
            <p className="text-surface-400 mb-4">You have no products yet.</p>
            <Link href="/seller/new-product" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
