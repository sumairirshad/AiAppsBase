import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Users, ShoppingBag, TrendingUp, ArrowRight, Shield, Code } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About AIAppsBase — The AI-Built App Marketplace',
  description:
    'AIAppsBase is the leading marketplace for buying and selling websites, apps, and UI components created with AI tools. Learn about our mission and how it works.',
  openGraph: {
    title: 'About AIAppsBase — The AI-Built App Marketplace',
    description: 'The leading marketplace for AI-built websites, apps, and UI components.',
    type: 'website',
  },
}

const stats = [
  { label: 'Products Listed', value: '1,200+' },
  { label: 'Active Sellers', value: '340+' },
  { label: 'Happy Buyers', value: '5,000+' },
  { label: 'AI Tools Supported', value: '9+' },
]

const steps = [
  {
    step: '01',
    title: 'Creators build with AI',
    description:
      'Developers and designers use AI tools like ChatGPT, Claude, v0, Bolt, and Cursor to build high-quality websites, apps, and components at incredible speed.',
    icon: Code,
  },
  {
    step: '02',
    title: 'Sellers list on AIAppsBase',
    description:
      'Creators upload their finished products — screenshots, source code, a live demo link — and set their price. Our team reviews and approves each listing.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Buyers purchase & download',
    description:
      'Buyers browse the marketplace, preview live demos, and purchase the products they love. After checkout they get instant access to the full source code.',
    icon: TrendingUp,
  },
]

const values = [
  {
    icon: Shield,
    title: 'Quality first',
    description: 'Every product is reviewed by our team before it goes live. No junk, no filler.',
  },
  {
    icon: Users,
    title: 'Creator-first revenue',
    description: "Sellers keep the majority of every sale. We succeed when our creators succeed.",
  },
  {
    icon: Zap,
    title: 'Speed over everything',
    description: 'AI tools compress weeks of work into hours. We built this platform to match that pace.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/50 via-surface-950 to-surface-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-brand-400 border border-brand-500/20 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Our Mission
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The marketplace for<br />
            <span className="gradient-text">AI-built products</span>
          </h1>
          <p className="text-surface-400 text-lg md:text-xl max-w-2xl mx-auto">
            AIAppsBase connects talented creators who build with AI tools with buyers who need
            production-ready websites, apps, and UI components — without starting from scratch.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center border border-white/5">
              <p className="text-3xl font-bold gradient-text mb-1">{value}</p>
              <p className="text-surface-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How AIAppsBase works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <div key={step} className="glass rounded-2xl p-8 border border-white/5 relative">
              <span className="absolute top-6 right-6 text-5xl font-black text-white/5">{step}</span>
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">What we stand for</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map(({ icon: Icon, title, description }) => (
            <div key={title} className="glass rounded-2xl p-8 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-surface-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass rounded-2xl p-12 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-purple-600/10" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to join AIAppsBase?</h2>
            <p className="text-surface-400 mb-8 max-w-md mx-auto">
              Browse thousands of AI-built products or start selling your own creations today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products" className="btn-primary flex items-center gap-2">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register" className="btn-secondary">
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
