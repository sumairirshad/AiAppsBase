import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Box, Puzzle, Palette, Layers } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { UploadCtaButton } from '@/components/products/upload-cta-button'
import { query } from '@/lib/db'

export const metadata: Metadata = {
  title: 'AI-Built UI Components & Libraries — React, Tailwind & More',
  description:
    'Browse UI component libraries and design systems built with AI. Buttons, cards, modals, and full component sets for React, Vue, and Tailwind CSS.',
  keywords: [
    'AI UI components', 'React component library', 'Tailwind components',
    'AI design system', 'UI kit', 'Next.js components', 'component library',
  ],
  openGraph: {
    title: 'AI-Built UI Components & Libraries | AIAppsBase',
    description: 'UI component libraries and design systems for React, Vue, and Tailwind CSS — built with AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built UI Components & Libraries | AIAppsBase',
    description: 'UI component libraries and design systems built with AI.',
  },
}

const subcategories = [
  { label: 'Component Libraries', href: '/products?category=Component+Library', icon: Layers },
  { label: 'UI Kits', href: '/products?category=Component+Library&tag=ui-kit', icon: Palette },
  { label: 'Design Systems', href: '/products?category=Component+Library&tag=design-system', icon: Puzzle },
  { label: 'All Components', href: '/products?category=Component+Library', icon: Box },
]

export default async function ComponentsPage() {
  const result = await query(
    `SELECT p.*, u.full_name AS seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.id
     WHERE p.status = 'approved'
       AND p.category = 'Component Library'
     ORDER BY p.created_at DESC`
  )
  const products = result.rows || []

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Box className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-purple-400 text-sm font-medium tracking-wide">UI Components</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            AI-Built <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">UI Components</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-2xl mb-8">
            Production-ready component libraries and design systems crafted with AI.
            Drop into your React, Vue, or Tailwind project and ship faster.
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
            <UploadCtaButton label="Upload Components" className="btn-primary text-sm py-2 px-4" />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-surface-400 text-sm">
            <span className="text-white font-semibold">{products.length}</span> component libraries available
          </p>
          <Link
            href="/products?category=Component+Library"
            className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
          >
            Advanced Filters <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center border border-white/5">
            <Box className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No components yet</h3>
            <p className="text-surface-400 mb-6">Be the first to upload a component library!</p>
            <UploadCtaButton label="Upload Components" />
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
