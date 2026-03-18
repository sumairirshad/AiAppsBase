'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Monitor, Tablet, Smartphone, ExternalLink, Heart, Share2, Download, ChevronLeft, CheckCircle } from 'lucide-react'
import { mockProducts, mockReviews, aiToolColors } from '@/lib/mock-data'
import { formatPrice, formatNumber, timeAgo } from '@/lib/utils'
import { ProductCard } from '@/components/products/product-card'
import { useParams } from 'next/navigation'

type DeviceFrame = 'desktop' | 'tablet' | 'mobile'

const deviceWidths: Record<DeviceFrame, string> = {
  desktop: 'w-full',
  tablet: 'max-w-[768px]',
  mobile: 'max-w-[375px]',
}

export default function ProductDetailPage() {
  const params = useParams()
  const product = mockProducts.find((p) => p.id === params.id) || mockProducts[0]
  const reviews = mockReviews.filter((r) => r.productId === product.id)
  const relatedProducts = mockProducts.filter((p) => p.id !== product.id).slice(0, 4)
  const [activeDevice, setActiveDevice] = useState<DeviceFrame>('desktop')
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'qa'>('description')

  const avgSubRatings = reviews.length > 0 ? {
    codeQuality: reviews.reduce((s, r) => s + r.codeQuality, 0) / reviews.length,
    design: reviews.reduce((s, r) => s + r.design, 0) / reviews.length,
    documentation: reviews.reduce((s, r) => s + r.documentation, 0) / reviews.length,
    valueForMoney: reviews.reduce((s, r) => s + r.valueForMoney, 0) / reviews.length,
  } : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link href="/products" className="inline-flex items-center gap-1.5 text-surface-400 hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Screenshot Gallery */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10" />
              <span className="text-6xl font-bold text-white/10">{product.title.charAt(0)}</span>
            </div>
            <div className="flex gap-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-14 rounded-lg bg-surface-800 border-2 border-transparent hover:border-brand-500 cursor-pointer transition-all flex items-center justify-center">
                  <span className="text-xs text-white/20">{i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          {product.previewUrl && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                <div className="flex items-center gap-2">
                  {(['desktop', 'tablet', 'mobile'] as DeviceFrame[]).map((device) => {
                    const Icon = device === 'desktop' ? Monitor : device === 'tablet' ? Tablet : Smartphone
                    return (
                      <button
                        key={device}
                        onClick={() => setActiveDevice(device)}
                        className={`p-2 rounded-lg transition-colors ${activeDevice === device ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                  <a href={product.previewUrl} target="_blank" rel="noopener noreferrer" className="ml-2 p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className={`mx-auto transition-all duration-300 ${deviceWidths[activeDevice]}`}>
                <div className="aspect-video bg-surface-800 rounded-lg border border-surface-700 flex items-center justify-center">
                  <p className="text-surface-500 text-sm">Live preview loads here</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex border-b border-white/10">
              {(['description', 'reviews', 'qa'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white border-b-2 border-brand-500' : 'text-surface-400 hover:text-white'}`}
                >
                  {tab === 'qa' ? 'Q&A' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'reviews' && ` (${reviews.length})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <p className="text-surface-300 leading-relaxed">{product.description}</p>

                  <div>
                    <h4 className="text-white font-semibold mb-3">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.techStack.map((tech) => (
                        <span key={tech} className="badge bg-surface-800 text-surface-300 border border-surface-700">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="badge bg-surface-800 text-surface-400 border border-surface-700">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* AI Transparency */}
                  <div className="glass rounded-xl p-5 space-y-4">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-400" /> AI Transparency Card
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-surface-500 uppercase tracking-wider">AI Tools Used</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {product.aiTools.map((tool) => (
                            <span key={tool} className={`badge border text-xs ${aiToolColors[tool]}`}>{tool}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-surface-500 uppercase tracking-wider">Human Modification</span>
                        <p className="text-white text-sm mt-1.5">{product.humanModLevel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating summary */}
                  {avgSubRatings && (
                    <div className="glass rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.entries(avgSubRatings).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-xs text-surface-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-white text-sm font-medium">{val.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <p className="text-surface-400 text-center py-8">No reviews yet.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                              {review.user.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-white text-sm font-medium">{review.user.name}</span>
                              {review.verified && (
                                <span className="ml-2 badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">Verified Purchase</span>
                              )}
                              <p className="text-xs text-surface-500">{timeAgo(review.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-surface-300 text-sm ml-11">{review.comment}</p>
                        {review.sellerResponse && (
                          <div className="ml-11 mt-3 p-3 rounded-lg bg-white/5 border-l-2 border-brand-500">
                            <span className="text-xs text-brand-400 font-medium">Seller Response</span>
                            <p className="text-surface-300 text-sm mt-1">{review.sellerResponse}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'qa' && (
                <p className="text-surface-400 text-center py-8">No questions yet. Be the first to ask!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Card */}
          <div className="glass rounded-xl p-6 space-y-4 sticky top-24">
            <div className="flex items-center gap-3 mb-2">
              {product.aiTools.map((tool) => (
                <span key={tool} className={`badge border text-xs ${aiToolColors[tool]}`}>{tool}</span>
              ))}
            </div>

            <h1 className="text-2xl font-bold text-white">{product.title}</h1>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-white font-medium">{product.rating}</span>
              </div>
              <span className="text-surface-500 text-sm">({product.reviewCount} reviews)</span>
              <span className="text-surface-500 text-sm">{formatNumber(product.salesCount)} sales</span>
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-bold">
                {product.seller.name.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{product.seller.name}</p>
                <p className="text-xs text-surface-400">Member since {new Date(product.seller.memberSince).getFullYear()}</p>
              </div>
              {product.seller.badges && product.seller.badges.length > 0 && (
                <span className="ml-auto badge bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                  {product.seller.badges[0]}
                </span>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-white">{formatPrice(product.price)}</span>
              </div>
              <p className="text-xs text-surface-500 mb-4">{product.licenseType} License</p>

              <button className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button className="btn-secondary w-full flex items-center justify-center gap-2 mb-3">
                Buy Now
              </button>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-2">
                  <Heart className="w-4 h-4" /> Wishlist
                </button>
                <button className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-surface-400">
                <span>Category</span>
                <span className="text-white">{product.category}</span>
              </div>
              <div className="flex justify-between text-surface-400">
                <span>Last Updated</span>
                <span className="text-white">{timeAgo(product.updatedAt)}</span>
              </div>
              <div className="flex justify-between text-surface-400">
                <span>Compatibility</span>
                <span className="text-white">Responsive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-8">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
