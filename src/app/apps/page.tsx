import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, ShoppingBag, BarChart2, Smartphone, Layers } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { UploadCtaButton } from '@/components/products/upload-cta-button'
import { query } from '@/lib/db'

export const metadata: Metadata = {
  title: 'AI-Built Web & Mobile Apps — SaaS, Dashboards & E-Commerce',
  description:
    'Discover full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI tools. Production-ready code built with Next.js, React, and more.',
  keywords: [
    'AI web apps', 'AI SaaS', 'full-stack apps', 'AI dashboard',
    'AI e-commerce', 'AI mobile apps', 'Next.js apps', 'React apps',
  ],
  openGraph: {
    title: 'AI-Built Web & Mobile Apps | AIAppsBase',
    description:
      'Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI. Production-ready code.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Web & Mobile Apps | AIAppsBase',
    description: 'Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI.',
  },
  alternates: { canonical: '/apps' },
}

export const revalidate = 300

const subcategories = [
  { label: 'Full-Stack Apps', href: '/products?category=Full-Stack+App', icon: Zap },
  { label: 'SaaS', href: '/products?category=SaaS', icon: Layers },
  { label: 'Dashboards', href: '/products?category=Dashboard', icon: BarChart2 },
  { label: 'E-Commerce', href: '/products?category=E-commerce', icon: ShoppingBag },
  { label: 'Mobile Apps', href: '/products?category=Mobile+App', icon: Smartphone },
]

export default async function AppsPage() {
  let products: any[] = []
  try {
    const result = await query(
      `SELECT p.*, u.full_name AS seller_name
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.status = 'approved'
         AND p.category IN ('Full-Stack App','SaaS','Dashboard','E-commerce','Mobile App')
       ORDER BY p.created_at DESC`
    )
    products = result.rows || []
  } catch (err) {
    console.error('AppsPage query failed:', (err as Error).message)
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-surface-950 to-surface-950" />
        <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-emerald-400 text-sm font-medium tracking-wide">Web & Mobile Apps</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            AI-Built <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Web & Mobile Apps</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-2xl mb-8">
            Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI.
            Production-ready code you can deploy today.
          </p>

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
            <UploadCtaButton label="Upload App" className="btn-primary text-sm py-2 px-4" />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-surface-400 text-sm">
            <span className="text-white font-semibold">{products.length}</span> apps available
          </p>
          <Link
            href="/products?category=Full-Stack+App"
            className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
          >
            Advanced Filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-white/5">
            <Zap className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No apps yet</h3>
            <p className="text-surface-400 mb-6">Be the first to upload a full-stack app!</p>
            <UploadCtaButton label="Upload App" />
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
