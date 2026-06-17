import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — AI Tools, Tips & Marketplace Insights',
  description:
    'Read the latest articles on AI-powered development, how to build and sell apps with AI tools, and marketplace tips from the AIForge team.',
  openGraph: {
    title: 'AIForge Blog — AI Tools, Tips & Insights',
    description: 'Articles on AI-powered development, building and selling with AI tools.',
    type: 'website',
  },
}

const posts = [
  {
    slug: 'building-saas-with-cursor-2025',
    title: 'How to Build a Full SaaS App with Cursor in a Weekend',
    excerpt:
      'A step-by-step guide to taking an idea from zero to a deployed, production-ready SaaS application using Cursor AI — in under 48 hours.',
    category: 'Tutorial',
    readTime: '8 min read',
    date: 'June 10, 2025',
    gradient: 'from-purple-500/10 to-brand-500/10',
    categoryColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    slug: 'v0-vs-bolt-component-libraries',
    title: 'v0 vs Bolt: Which AI Tool Builds Better UI Components?',
    excerpt:
      "We put both tools through their paces building the same component library. Here's what we found — and which one won.",
    category: 'Comparison',
    readTime: '6 min read',
    date: 'June 3, 2025',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    slug: 'pricing-your-ai-templates',
    title: 'How to Price Your AI-Built Templates on AIForge',
    excerpt:
      "Pricing is the hardest part of selling digital products. We analyzed 500+ sales on AIForge to figure out what pricing strategies actually work.",
    category: 'Seller Guide',
    readTime: '5 min read',
    date: 'May 27, 2025',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    categoryColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    slug: 'claude-vs-chatgpt-for-frontend',
    title: 'Claude vs ChatGPT for Frontend Development in 2025',
    excerpt:
      'Both are powerful, but they have very different strengths when it comes to building UIs, writing clean Tailwind, and debugging React.',
    category: 'Comparison',
    readTime: '7 min read',
    date: 'May 20, 2025',
    gradient: 'from-orange-500/10 to-amber-500/10',
    categoryColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    slug: 'sell-your-first-product-guide',
    title: 'Complete Guide to Selling Your First Product on AIForge',
    excerpt:
      "Everything you need to know — from setting up your seller account, to writing a product description that converts, to uploading screenshots that sell.",
    category: 'Seller Guide',
    readTime: '10 min read',
    date: 'May 14, 2025',
    gradient: 'from-pink-500/10 to-rose-500/10',
    categoryColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
  {
    slug: 'nextjs-15-ai-app-starter',
    title: 'The Best Next.js 15 Starter for AI-Powered Apps',
    excerpt:
      "We built the starter kit we always wished existed — auth, payments, database, and AI integrations wired up from day one.",
    category: 'Resources',
    readTime: '4 min read',
    date: 'May 7, 2025',
    gradient: 'from-brand-500/10 to-indigo-500/10',
    categoryColor: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  },
]

export default function BlogPage() {
  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <section className="border-b border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AIForge <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            Tutorials, comparisons, and tips for building and selling AI-powered products.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured post */}
        <div className={`glass rounded-2xl p-8 md:p-12 border border-white/5 bg-gradient-to-br ${featured.gradient} mb-12 relative overflow-hidden`}>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${featured.categoryColor}`}>
                {featured.category}
              </span>
              <span className="text-surface-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> {featured.readTime}
              </span>
              <span className="text-surface-500 text-xs">{featured.date}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 max-w-2xl">
              {featured.title}
            </h2>
            <p className="text-surface-400 mb-6 max-w-xl leading-relaxed">{featured.excerpt}</p>
            <span className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors cursor-pointer">
              Read article <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="glass rounded-2xl border border-white/5 overflow-hidden card-hover group cursor-pointer"
            >
              <div className={`h-2 bg-gradient-to-r ${post.gradient.replace('/10', '')}`} />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${post.categoryColor}`}>
                    <Tag className="w-2.5 h-2.5 inline mr-1" />
                    {post.category}
                  </span>
                  <span className="text-surface-600 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-brand-300 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-surface-400 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-surface-600 text-xs">{post.date}</span>
                  <span className="text-brand-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-surface-500 text-sm mt-12">
          More articles coming soon. Follow us for updates.
        </p>
      </div>
    </div>
  )
}
