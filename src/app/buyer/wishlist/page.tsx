'use client'

import { useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { mockProducts } from '@/lib/mock-data'
import { Product } from '@/types'

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>(mockProducts.slice(0, 3))

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Wishlist</h1>
        <p className="text-surface-400">{wishlist.length} saved product{wishlist.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Wishlist Grid */}
      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="relative group/wish">
              <ProductCard product={product} />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  removeFromWishlist(product.id)
                }}
                className="absolute top-3 right-3 z-10 p-2 glass rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors opacity-0 group-hover/wish:opacity-100"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <Heart className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Your wishlist is empty</h3>
          <p className="text-surface-400">Browse the marketplace and save products you love.</p>
        </div>
      )}
    </div>
  )
}
