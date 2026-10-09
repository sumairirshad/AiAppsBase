import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart2, Check, Layers, ShoppingBag, Smartphone, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from '@/components/marketplace/product-card'
import { UploadCtaButton } from '@/components/products/upload-cta-button'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Faq } from '@/components/seo/faq'
import { JsonLd } from '@/components/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo'
import { listApprovedProducts } from '@/lib/products'

export const metadata: Metadata = {
  title: 'AI-Built Web & Mobile Apps — SaaS, Dashboards & E-Commerce',
  description:
    'Discover full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI tools. Production-ready code built with Next.js, React, and more.',
  keywords: [
    'AI web apps', 'AI SaaS', 'full-stack apps', 'AI dashboard',
    'AI e-commerce', 'AI mobile apps', 'Next.js apps', 'React apps',
  ],
  alternates: { canonical: '/apps' },
  openGraph: {
    title: 'AI-Built Web & Mobile Apps | AIAppsBase',
    description:
      'Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI. Production-ready code.',
    type: 'website',
    url: '/apps',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Web & Mobile Apps | AIAppsBase',
    description: 'Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI.',
  },
}

export const revalidate = 300

const APPS_CATEGORY_SLUGS = ['web-apps', 'ecommerce', 'mobile-apps']

const faqItems = [
  {
    q: 'What\'s the difference between a SaaS boilerplate and a full app listing?',
    a: 'A SaaS boilerplate ships the scaffolding — auth, billing, a dashboard shell — meant as a starting point you build on. A full app listing is a complete, specific product (an admin dashboard, a booking app) ready to use with lighter customization.',
  },
  {
    q: 'Do these apps come with a database and backend already set up?',
    a: 'Most do — check each listing\'s tech stack for the database and backend framework used (commonly PostgreSQL, Prisma, or Supabase). Connection setup is documented in the product\'s README.',
  },
  {
    q: 'Can I see the app running before I buy?',
    a: 'Yes, every listing links to a live, clickable demo so you can test the actual UI and flows before purchasing.',
  },
  {
    q: 'Are these apps suitable for production use?',
    a: 'They\'re reviewed for a working demo and accurate description, but production readiness (error handling, scaling, security hardening) varies by listing — review the code and the seller\'s documentation before launching with real users.',
  },
]

export default async function AppsPage() {
  const products = (await listApprovedProducts())
    .filter((p) => APPS_CATEGORY_SLUGS.includes(p.categorySlug))
    .slice(0, 8)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Marketplace', href: '/products' }, { label: 'Web & Mobile Apps', href: '/apps' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Zap className="size-3" /> Web &amp; Mobile Apps</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Full-stack apps, SaaS &amp; dashboards, ready to deploy
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Production-ready web and mobile apps built with AI — SaaS platforms, admin dashboards,
          e-commerce stores, and mobile apps, with the backend plumbing already wired up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=web-apps,ecommerce,mobile-apps">Browse all apps <ArrowRight className="size-4" /></Link>
          </Button>
          <UploadCtaButton label="Upload an app" size="lg" variant="outline" />
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <Layers className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">SaaS boilerplates</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Auth, billing, and a dashboard shell already wired up — the plumbing every SaaS
              needs before you build your actual product.
            </p>
            <Link href="/products?subcategory=saas-boilerplates" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse SaaS <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <BarChart2 className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Admin dashboards</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Data tables, charts, and CRUD flows ready to point at your own API or database.
            </p>
            <Link href="/products?subcategory=dashboards" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse dashboards <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <ShoppingBag className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">E-commerce stores</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Storefronts and headless commerce backends with checkout and cart logic already
              built.
            </p>
            <Link href="/ecommerce" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse e-commerce <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Smartphone className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Mobile apps</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cross-platform and native iOS/Android apps, from React Native starters to
              full-featured products.
            </p>
            <Link href="/mobile-apps" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse mobile apps <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Why buy an app instead of building one</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Auth, billing, and a working data layer are table stakes for a real app — and the part
          that eats the most time before you get to build what makes your product different.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Full source code, not just a design file',
            'Backend and database already connected and documented',
            'A live, clickable demo so you can test it before buying',
            'Reviewed for a working demo and accurate description',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {products.length > 0 && (
        <section className="container pb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed apps</h2>
            <Link href="/products?category=web-apps,ecommerce,mobile-apps" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} repo={p} />)}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="container max-w-3xl">
          <h2 className="mb-2 text-center font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mb-8 text-center text-muted-foreground">Everything buyers ask before purchasing an app.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Web & Mobile Apps',
              description: 'Full-stack apps, SaaS platforms, dashboards, and e-commerce stores built with AI.',
              url: '/apps',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/ship-saas-in-a-weekend" className="text-sm font-medium text-primary hover:underline">Ship a SaaS in a weekend &rarr;</Link></li>
          <li><Link href="/blog/first-product-guide" className="text-sm font-medium text-primary hover:underline">Your first product: a seller&apos;s guide &rarr;</Link></li>
          <li><Link href="/ai-projects" className="text-sm font-medium text-primary hover:underline">Browse AI projects &rarr;</Link></li>
          <li><Link href="/templates" className="text-sm font-medium text-primary hover:underline">Browse website templates &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
