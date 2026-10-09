import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code, Shield, ShoppingBag, TrendingUp, Users, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getPlatformStats, isPlatformEstablished } from '@/lib/products'
import { cn, formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'About',
  description:
    'AIAppsBase is the leading marketplace for buying and selling websites, apps, and UI components created with AI tools. Learn about our mission and how it works.',
  openGraph: {
    title: 'About AIAppsBase — The AI-Built App Marketplace',
    description: 'The leading marketplace for AI-built websites, apps, and UI components.',
    type: 'website',
  },
}


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

export default async function AboutPage() {
  const platformStats = await getPlatformStats()
  // Sellers/sales/payouts only read as credible once they're meaningfully
  // large — see isPlatformEstablished(). The listing count alone is fine
  // to show regardless of how new the marketplace is.
  const stats = isPlatformEstablished(platformStats)
    ? [
        { label: 'Products listed', value: platformStats.products.toLocaleString() },
        { label: 'Active sellers', value: platformStats.sellers.toLocaleString() },
        { label: 'Completed sales', value: platformStats.sales.toLocaleString() },
        { label: 'Paid to creators', value: `$${formatNumber(platformStats.paidOut)}` },
      ]
    : [{ label: 'Products listed', value: platformStats.products.toLocaleString() }]

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      {/* Hero */}
      <section className="container max-w-4xl py-20 text-center sm:py-28">
        <Badge variant="brand" className="px-3 py-1"><Zap className="size-3" /> Our Mission</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          The marketplace for<br />
          <span className="text-gradient-brand">AI-built products</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          AIAppsBase connects talented creators who build with AI tools with buyers who need
          production-ready websites, apps, and UI components — without starting from scratch.
        </p>
      </section>

      {/* Stats */}
      <section className="container py-16">
        <div className={cn('grid gap-6', stats.length > 1 ? 'grid-cols-2 md:grid-cols-4' : 'mx-auto max-w-xs')}>
          {stats.map(({ label, value }) => (
            <Card key={label} className="p-6 text-center">
              <p className="mb-1 font-display text-3xl font-bold text-gradient-brand">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16">
        <h2 className="mb-12 text-center font-display text-3xl font-bold tracking-tight">How AIAppsBase works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <Card key={step} className="relative p-8">
              <span className="absolute right-6 top-6 text-5xl font-black text-muted-foreground/10">{step}</span>
              <div className="mb-5 grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                <Icon className="size-6 text-primary" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="container py-16">
        <h2 className="mb-12 text-center font-display text-3xl font-bold tracking-tight">What we stand for</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-8">
              <div className="mb-4 grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-4xl py-16">
        <Card className="relative overflow-hidden p-12 text-center">
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 to-fuchsia-500/10" />
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Ready to join AIAppsBase?</h2>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            Browse thousands of AI-built products or start selling your own creations today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/products">Browse Marketplace <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">Start Selling</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
