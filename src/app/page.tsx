import Link from 'next/link'
import { ArrowRight, Zap, Shield, TrendingUp, Code, Sparkles, Users, Package, Star } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { query } from '@/lib/db'

const categories = [
  { name: 'Website Templates', icon: Code, count: 340, href: '/products?category=Website+Template' },
  { name: 'Web Apps', icon: Zap, count: 285, href: '/products?category=Full-Stack+App' },
  { name: 'Dashboards', icon: TrendingUp, count: 192, href: '/products?category=Dashboard' },
  { name: 'E-Commerce', icon: Package, count: 156, href: '/products?category=E-commerce' },
  { name: 'Mobile Apps', icon: Sparkles, count: 98, href: '/products?category=Mobile+App' },
  { name: 'Components', icon: Shield, count: 421, href: '/products?category=Component+Library' },
]

const aiTools = [
  { name: 'ChatGPT', color: 'from-emerald-500 to-emerald-700' },
  { name: 'Claude', color: 'from-orange-500 to-orange-700' },
  { name: 'v0', color: 'from-white/80 to-gray-400' },
  { name: 'Bolt', color: 'from-blue-500 to-blue-700' },
  { name: 'Cursor', color: 'from-purple-500 to-purple-700' },
  { name: 'Lovable', color: 'from-pink-500 to-pink-700' },
]

export default async function HomePage() {
  const productsRes = await query('SELECT * FROM products ORDER BY created_at DESC LIMIT 8')
  const products = productsRes.rows || []

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/50 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl animate-float" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 badge bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              The #1 Marketplace for AI-Built Products
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">Discover </span>
              <span className="gradient-text">AI-Built</span>
              <br />
              <span className="text-white">Apps & Templates</span>
            </h1>

            <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10">
              Browse thousands of websites, web apps, and mobile apps crafted with AI tools.
              Find the perfect starting point for your next project.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/products" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register" className="btn-secondary text-base px-8 py-3">
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tool Filter Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-surface-400 text-sm mr-2">Built with:</span>
          {aiTools.map((tool) => (
            <Link
              key={tool.name}
              href={`/products?aiTool=${tool.name}`}
              className="glass glass-hover rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${tool.color}`} />
              {tool.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Browse Categories</h2>
          <Link href="/products" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <div className="glass glass-hover rounded-xl p-5 text-center card-hover border border-white/5">
                <cat.icon className="w-8 h-8 text-brand-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">{cat.name}</h3>
                <p className="text-xs text-surface-500">{cat.count} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Latest Products</h2>
          <Link href="/products" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            View All Marketplace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl border border-white/5">
            <Package className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <p className="text-surface-400">No products found. Start selling today!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="glass rounded-2xl p-12 text-center relative overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-purple-600/10 opacity-50" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to sell your AI-built creations?</h2>
            <p className="text-surface-400 mb-8 max-w-lg mx-auto">
              Join thousands of creators earning revenue from their AI-built apps, templates, and components.
            </p>
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
              Become a Seller <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
