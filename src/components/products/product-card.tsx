'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Star, ShoppingCart, Eye, Package, Loader2 } from 'lucide-react'
import { formatPrice, formatNumber } from '@/lib/utils'
import { productPath } from '@/lib/seo'

const aiToolColors: Record<string, string> = {
  ChatGPT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Claude: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  v0: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  Bolt: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Cursor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Lovable: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Other: 'bg-surface-800 text-surface-400 border-surface-700',
}

export function ProductCard({ product }: { product: any }) {
  const [addingToCart, setAddingToCart] = useState(false)

  const handlePreview = (e: React.MouseEvent) => {
    if (product.preview_url) {
      e.preventDefault()
      e.stopPropagation()
      window.open(product.preview_url, '_blank')
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (addingToCart) return
    setAddingToCart(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add to cart')
      toast.success(`${product.title} added to cart`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <Link href={productPath({ id: product.id, title: product.title })}>
      <div className="glass rounded-xl overflow-hidden card-hover group border border-white/5 hover:border-brand-500/30 transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-surface-800 overflow-hidden">
          {product.screenshots && product.screenshots[0] ? (
            <Image
              src={product.screenshots[0]}
              alt={product.title}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-600 bg-gradient-to-br from-surface-800 to-surface-950">
              <Package className="w-10 h-10" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-3">
              {product.preview_url && (
                <button 
                  onClick={handlePreview}
                  className="p-2.5 glass rounded-full hover:bg-brand-500 hover:text-white transition-all transform hover:scale-110"
                  title="Live Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="p-2.5 glass rounded-full hover:bg-brand-500 hover:text-white transition-all transform hover:scale-110 disabled:opacity-60"
                title="Add to Cart"
              >
                {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="absolute top-3 left-3">
            <span className="badge bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px]">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* AI Tool Badges */}
          <div className="flex flex-wrap gap-1.5">
            {product.ai_tools?.slice(0, 3).map((tool: string) => (
              <span
                key={tool}
                className={`badge border text-[9px] px-1.5 py-0.5 ${aiToolColors[tool] || aiToolColors.Other}`}
              >
                {tool}
              </span>
            ))}
          </div>

          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-brand-400 transition-colors">
            {product.title}
          </h3>

          <p className="text-surface-400 text-xs line-clamp-2 min-h-[32px]">
            {product.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {Number(product.review_count) > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-white font-medium">{Number(product.rating).toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-surface-500">No reviews yet</span>
              )}
              {Number(product.sales) > 0 && (
                <span className="text-[10px] text-surface-500">{formatNumber(Number(product.sales))} sales</span>
              )}
            </div>
            <span className="text-sm font-bold text-white">
              {product.price === 0 ? 'Free' : `$${parseFloat(product.price).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
