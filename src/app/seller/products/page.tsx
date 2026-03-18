'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, PauseCircle, Trash2, Eye } from 'lucide-react'
import { mockProducts } from '@/lib/mock-data'
import { formatPrice, timeAgo } from '@/lib/utils'
import { ProductStatus } from '@/types'

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

// Simulate seller's own products with mixed statuses
const sellerProducts = [
  ...mockProducts.slice(0, 3).map((p) => ({ ...p, status: 'approved' as ProductStatus })),
  { ...mockProducts[3], status: 'pending' as ProductStatus },
  { ...mockProducts[4], status: 'rejected' as ProductStatus },
]

export default function SellerProductsPage() {
  const [products, setProducts] = useState(sellerProducts)

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Products</h1>
          <p className="text-surface-400 mt-1">Manage your listed products.</p>
        </div>
        <Link
          href="/seller/new-product"
          className="btn-primary flex items-center gap-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="glass rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 card-hover"
          >
            {/* Thumbnail placeholder */}
            <div className="w-20 h-20 rounded-lg bg-surface-800 flex-shrink-0 flex items-center justify-center">
              <Eye className="w-6 h-6 text-surface-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-semibold truncate">{product.title}</h3>
                <span
                  className={`badge ${statusStyles[product.status]}`}
                >
                  {statusLabels[product.status]}
                </span>
              </div>
              <p className="text-surface-400 text-sm line-clamp-1">{product.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                <span>{formatPrice(product.price)}</span>
                <span>{product.salesCount} sales</span>
                <span>Updated {timeAgo(product.updatedAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="p-2 rounded-lg bg-surface-800/50 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg bg-surface-800/50 hover:bg-yellow-500/20 text-surface-300 hover:text-yellow-400 transition-colors"
                title="Pause"
              >
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
              <Plus className="w-4 h-4" />
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
