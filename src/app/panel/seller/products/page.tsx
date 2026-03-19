'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Package, ExternalLink, Edit, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Products</h1>
          <p className="text-surface-400 text-sm">Manage and track your AI-built products.</p>
        </div>
        <Link href="/panel/seller/add-product" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border-dashed border-surface-700">
          <Package className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
          <p className="text-surface-500 mb-6">Start selling your AI creations today!</p>
          <Link href="/panel/seller/add-product" className="btn-secondary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="glass rounded-xl overflow-hidden group border border-white/5 hover:border-brand-500/30 transition-all duration-300">
              {/* Product Preview Image */}
              <div className="aspect-video relative overflow-hidden bg-surface-800">
                {product.screenshots && product.screenshots[0] ? (
                  <img 
                    src={product.screenshots[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-600">
                    <Package className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="badge bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px]">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-surface-400 text-sm line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="text-lg font-bold text-white">
                    {product.price === 0 ? 'Free' : `$${parseFloat(product.price).toFixed(2)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    {product.preview_url && (
                      <a 
                        href={product.preview_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-surface-800 text-surface-400 hover:text-white rounded-lg transition-colors border border-surface-700"
                        title="Live Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button className="p-2 bg-surface-800 text-surface-400 hover:text-brand-400 rounded-lg transition-colors border border-surface-700" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-surface-800 text-surface-400 hover:text-red-400 rounded-lg transition-colors border border-surface-700" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
