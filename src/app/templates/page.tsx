import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code, LayoutTemplate, Globe, Layers } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { UploadCtaButton } from '@/components/products/upload-cta-button'
import { query } from '@/lib/db'

export const metadata: Metadata = {
  title: 'AI-Built Website Templates — Landing Pages, Portfolios & More',
  description:
    'Browse premium website templates built with AI tools like ChatGPT, Claude, v0, and Cursor. Ready-to-use landing pages, portfolio sites, and business websites.',
  keywords: [
    'AI website templates', 'HTML templates', 'Next.js templates',
    'landing page templates', 'portfolio templates', 'AI-built website',
  ],
  openGraph: {
    title: 'AI-Built Website Templates | AIAppsBase',
    description:
      'Premium landing pages, portfolios, and business websites crafted with AI. Download and ship faster than ever.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Website Templates | AIAppsBase',
    description: 'Premium landing pages, portfolios, and business websites crafted with AI.',
  },
}

const subcategories = [
  { label: 'Landing Pages', href: '/products?category=Landing+Page', icon: Globe },
  { label: 'Portfolios', href: '/products?category=Portfolio', icon: Layers },
  { label: 'Blogs', href: '/products?category=Blog', icon: Code },
  { label: 'All Templates', href: '/products?category=Website+Template', icon: LayoutTemplate },
]

export default async function TemplatesPage() {
  let products: any[] = []
  try {
    const result = await query(
      `SELECT p.*, u.full_name AS seller_name,
              agg.avg_rating AS rating, agg.review_count, ord.sales
       FROM products p
       JOIN users u ON p.seller_id = u.id
       LEFT JOIN (
         SELECT product_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS review_count
         FROM reviews GROUP BY product_id
       ) agg ON agg.product_id = p.id
       LEFT JOIN (
         SELECT product_id, COUNT(*)::int AS sales
         FROM orders WHERE status = 'completed' GROUP BY product_id
       ) ord ON ord.product_id = p.id
       WHERE p.status = 'approved'
         AND p.category IN ('Website Template','Landing Page','Portfolio','Blog')
       ORDER BY p.created_at DESC`
    )
    products = result.rows || []
  } catch (err) {
    console.error('TemplatesPage query failed:', (err as Error).message)
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/3 w-[700px] h-[400px] bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-blue-400 text-sm font-medium tracking-wide">Website Templates</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            AI-Built <span className="gradient-text">Website Templates</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-2xl mb-8">
            Premium landing pages, portfolios, and business websites crafted with AI tools.
            Download, customize, and deploy in minutes.
          </p>

          {/* Subcategory pills + Upload CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {subcategories.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="glass glass-hover rounded-full px-4 py-2 text-sm text-surface-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/10 hidden sm:block" />
            <UploadCtaButton label="Upload Template" className="btn-primary text-sm py-2 px-4" />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-surface-400 text-sm">
            <span className="text-white font-semibold">{products.length}</span> templates available
          </p>
          <Link
            href="/products?category=Website+Template"
            className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
          >
            Advanced Filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-white/5">
            <LayoutTemplate className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No templates yet</h3>
            <p className="text-surface-400 mb-6">Be the first to upload a website template!</p>
            <UploadCtaButton label="Upload Template" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
