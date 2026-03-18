import Link from 'next/link'
import { Star, ShoppingCart, Eye } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, formatNumber } from '@/lib/utils'
import { aiToolColors } from '@/lib/mock-data'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="glass rounded-xl overflow-hidden card-hover group">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-surface-800 to-surface-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-purple-600/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-white/20">{product.title.charAt(0)}</span>
          </div>
          {product.featured && (
            <div className="absolute top-3 left-3 badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Featured
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <span className="p-2 glass rounded-full"><Eye className="w-4 h-4" /></span>
              <span className="p-2 glass rounded-full"><ShoppingCart className="w-4 h-4" /></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* AI Tool Badges */}
          <div className="flex flex-wrap gap-1.5">
            {product.aiTools.map((tool) => (
              <span
                key={tool}
                className={`badge border text-[10px] ${aiToolColors[tool] || aiToolColors.Other}`}
              >
                {tool}
              </span>
            ))}
          </div>

          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-brand-400 transition-colors">
            {product.title}
          </h3>

          <p className="text-surface-400 text-xs line-clamp-2">
            {product.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs text-white font-medium">{product.rating}</span>
              <span className="text-xs text-surface-500">({formatNumber(product.salesCount)} sales)</span>
            </div>
            <span className="text-sm font-bold text-white">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
              {product.seller.name.charAt(0)}
            </div>
            <span className="text-xs text-surface-400">{product.seller.name}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
