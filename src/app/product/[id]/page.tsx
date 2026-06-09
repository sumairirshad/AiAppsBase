'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Star,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Heart,
  Share2,
  Download,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { aiToolColors } from '@/lib/mock-data'
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils'
import { ProductCard } from '@/components/products/product-card'
import { BuyButton } from '@/components/products/buy-button'
import type { Product, Review } from '@/types'

type DeviceFrame = 'Desktop' | 'Tablet' | 'Mobile'

const deviceFrames: { label: DeviceFrame; icon: typeof Monitor; width: string }[] = [
  { label: 'Desktop', icon: Monitor, width: '100%' },
  { label: 'Tablet', icon: Tablet, width: '768px' },
  { label: 'Mobile', icon: Smartphone, width: '375px' },
]

const humanModColors: Record<string, string> = {
  'Pure AI': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Lightly Edited': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Heavily Modified': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'AI-Assisted': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-600'
          }`}
        />
      ))}
    </div>
  )
}

function SubRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-surface-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
        </div>
        <span className="text-white text-xs font-medium w-6 text-right">{value.toFixed(1)}</span>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {review.user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-white flex items-center gap-2">
              {review.user.name}
              {review.verified && (
                <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                  Verified
                </span>
              )}
            </p>
            <p className="text-xs text-surface-500">{timeAgo(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-surface-300 leading-relaxed">{review.comment}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-2 border-t border-white/5">
        <SubRating label="Code Quality" value={review.codeQuality} />
        <SubRating label="Design" value={review.design} />
        <SubRating label="Documentation" value={review.documentation} />
        <SubRating label="Value for Money" value={review.valueForMoney} />
      </div>
      {review.sellerResponse && (
        <div className="bg-surface-800/50 rounded-lg p-3 mt-2 border-l-2 border-brand-500">
          <p className="text-xs text-brand-400 font-medium mb-1">Seller Response</p>
          <p className="text-sm text-surface-300">{review.sellerResponse}</p>
        </div>
      )}
    </div>
  )
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [activeScreenshot, setActiveScreenshot] = useState(0)
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('Desktop')
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetch(`/api/marketplace/${params.id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        const data = await res.json()
        if (data.product) {
          setProduct(data.product)
          setReviews(data.reviews ?? [])
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="glass rounded-xl p-12 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Product not found</h2>
          <p className="text-surface-400 text-sm mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/products" className="btn-primary text-sm inline-block">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const avgCodeQuality = reviews.length > 0 ? reviews.reduce((s, r) => s + r.codeQuality, 0) / reviews.length : 0
  const avgDesign = reviews.length > 0 ? reviews.reduce((s, r) => s + r.design, 0) / reviews.length : 0
  const avgDocumentation = reviews.length > 0 ? reviews.reduce((s, r) => s + r.documentation, 0) / reviews.length : 0
  const avgValueForMoney = reviews.length > 0 ? reviews.reduce((s, r) => s + r.valueForMoney, 0) / reviews.length : 0

  const activeDevice = deviceFrames.find((d) => d.label === deviceFrame)!

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-brand-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Screenshots */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass rounded-xl overflow-hidden aspect-[16/10]">
              {product.screenshots?.[activeScreenshot] ? (
                <img
                  src={product.screenshots[activeScreenshot]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-600/30 via-purple-600/20 to-surface-900 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white/10">{product.title.charAt(0)}</span>
                </div>
              )}
            </div>
            {product.screenshots?.length > 1 && (
              <div className="flex gap-3">
                {product.screenshots.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScreenshot(idx)}
                    className={`flex-1 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                      activeScreenshot === idx
                        ? 'border-brand-500 shadow-lg shadow-brand-500/20'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-3">{product.title}</h1>
              <div className="flex items-center gap-3">
                <StarRating rating={product.rating} size="md" />
                <span className="text-white font-medium">{product.rating}</span>
                <span className="text-surface-400 text-sm">
                  ({formatNumber(product.reviewCount)} reviews)
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-surface-400">
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {formatNumber(product.salesCount)} sales
                </span>
              </div>
            </div>

            {/* Seller */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  {product.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{product.seller.name}</p>
                  <p className="text-xs text-surface-400">
                    Member since {new Date(product.seller.memberSince).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Tools */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-3">Built With AI</h3>
              <div className="flex flex-wrap gap-2">
                {product.aiTools.map((tool) => (
                  <span key={tool} className={`badge border ${aiToolColors[tool] || aiToolColors.Other}`}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Price & Buy */}
            <div className="glass rounded-xl p-4 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-surface-400 mb-1">Price</p>
                  <p className="text-3xl font-bold gradient-text">{formatPrice(product.price)}</p>
                </div>
                <span className="badge bg-surface-800 text-surface-300 border border-surface-700">
                  {product.licenseType}
                </span>
              </div>

              <BuyButton productId={product.id} licenseType={product.licenseType} label="Buy Now" />

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex-1 btn-secondary text-sm flex items-center justify-center gap-1.5 ${
                    liked ? 'text-pink-400 border-pink-500/30' : ''
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-pink-400' : ''}`} />
                  Wishlist
                </button>
                <button className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {product.previewUrl && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Live Preview</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center glass rounded-lg p-1">
                  {deviceFrames.map((device) => {
                    const Icon = device.icon
                    return (
                      <button
                        key={device.label}
                        onClick={() => setDeviceFrame(device.label)}
                        className={`p-2 rounded-md transition-colors ${
                          deviceFrame === device.label
                            ? 'bg-brand-600 text-white'
                            : 'text-surface-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
                <a
                  href={product.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </a>
              </div>
            </div>
            <div className="glass rounded-xl overflow-hidden p-4 flex justify-center">
              <div
                className="bg-surface-900 rounded-lg overflow-hidden transition-all duration-300"
                style={{ width: activeDevice.width, maxWidth: '100%' }}
              >
                <iframe
                  src={product.previewUrl}
                  className="w-full aspect-[16/10] border-0"
                  title="Live Preview"
                />
              </div>
            </div>
          </section>
        )}

        {/* Description & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-8">
            <section className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Description</h2>
              <div className="text-surface-300 text-sm leading-relaxed space-y-4">
                {product.description.split('. ').map((sentence, i) => (
                  <p key={i}>{sentence.endsWith('.') ? sentence : `${sentence}.`}</p>
                ))}
              </div>
            </section>
            <section className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge bg-surface-800 text-surface-300 border border-surface-700">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
            <section className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {product.techStack.map((tech) => (
                  <span key={tech} className="badge bg-brand-600/20 text-brand-400 border border-brand-500/30">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">AI Transparency</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider mb-2">AI Tools Used</p>
                  <div className="flex flex-wrap gap-2">
                    {product.aiTools.map((tool) => (
                      <span key={tool} className={`badge border ${aiToolColors[tool] || aiToolColors.Other}`}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider mb-2">Human Modification</p>
                  <span className={`badge border ${humanModColors[product.humanModLevel] || 'bg-surface-800 text-surface-300 border-surface-700'}`}>
                    {product.humanModLevel}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider mb-2">Category</p>
                  <span className="badge bg-surface-800 text-surface-300 border border-surface-700">{product.category}</span>
                </div>
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider mb-2">License</p>
                  <span className="badge bg-surface-800 text-surface-300 border border-surface-700">{product.licenseType}</span>
                </div>
                <div>
                  <p className="text-xs text-surface-400 uppercase tracking-wider mb-2">Last Updated</p>
                  <p className="text-sm text-surface-300">{timeAgo(product.updatedAt)}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Reviews */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-6">
            Reviews <span className="text-surface-400 font-normal text-sm">({formatNumber(product.reviewCount)})</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass rounded-xl p-6 space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold gradient-text">{product.rating}</p>
                <StarRating rating={product.rating} size="md" />
                <p className="text-xs text-surface-400 mt-1">{formatNumber(product.reviewCount)} reviews</p>
              </div>
              {reviews.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <SubRating label="Code Quality" value={avgCodeQuality} />
                  <SubRating label="Design" value={avgDesign} />
                  <SubRating label="Documentation" value={avgDocumentation} />
                  <SubRating label="Value for Money" value={avgValueForMoney} />
                </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-surface-400 text-sm">No reviews yet for this product.</p>
                </div>
              ) : (
                reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
