import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, Store, Server, ArrowRight, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from '@/components/marketplace/product-card'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Faq } from '@/components/seo/faq'
import { JsonLd } from '@/components/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo'
import { listApprovedProducts } from '@/lib/products'

export const metadata: Metadata = {
  title: 'AI-Built E-Commerce Templates — Storefronts & Headless Backends',
  description:
    'Buy AI-built e-commerce storefronts and headless commerce backends — Stripe checkout, product catalogs, and cart logic already wired up. Reviewed, demo-tested code.',
  alternates: { canonical: '/ecommerce' },
  keywords: [
    'AI e-commerce template', 'Next.js storefront template', 'headless commerce boilerplate',
    'AI-built online store', 'Stripe checkout template', 'e-commerce starter kit',
  ],
  openGraph: {
    title: 'AI-Built E-Commerce Templates — Storefronts & Headless Backends',
    description: 'Storefronts and headless commerce backends with checkout, catalog, and cart logic already built.',
    type: 'website',
    url: '/ecommerce',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built E-Commerce Templates — Storefronts & Headless Backends',
    description: 'Storefronts and headless commerce backends with checkout, catalog, and cart logic already built.',
  },
}

const faqItems = [
  {
    q: 'Do these templates come with payment processing already configured?',
    a: 'Most storefront listings ship with Stripe (and sometimes PayPal) checkout wired into the cart flow, using test-mode keys you swap for your own live keys at launch. The product page for each listing spells out exactly which payment providers are integrated.',
  },
  {
    q: 'What\'s the difference between a storefront and a headless commerce backend?',
    a: 'A storefront is a complete, styled shopping experience — catalog pages, cart, checkout, and account area. A headless backend is the commerce logic and API layer without a fixed front end, meant for teams building a custom UI on top of it, often in a different framework than the seller used.',
  },
  {
    q: 'Can I connect these templates to my existing product catalog or inventory system?',
    a: 'Depends on the listing — check the tech stack and integrations listed on the product page. Many storefronts use a standard PostgreSQL or headless CMS data layer that\'s straightforward to point at an existing catalog with some migration work.',
  },
  {
    q: 'Are these templates suitable for a real, live store or just a demo?',
    a: 'They\'re built to be launched, not just demoed — but as with any commerce code handling real payments, review the checkout and webhook logic carefully and test with your own live Stripe keys before taking real orders.',
  },
]

export default async function EcommercePage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'ecommerce').slice(0, 6)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'E-Commerce', href: '/ecommerce' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><ShoppingBag className="size-3" /> E-Commerce</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Launch a store without building checkout from scratch
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          AI-built storefronts and headless commerce backends with product catalogs, cart logic,
          and payment processing already working — not a design mockup, a store you can actually
          take orders on.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=ecommerce">Browse e-commerce templates <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">List your store template</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <Store className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Storefronts</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Complete, styled shopping experiences — product listings, cart, checkout, and account
              pages — ready to point at your own catalog and payment account.
            </p>
            <Link href="/products?subcategory=storefronts" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse storefronts <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Server className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Headless commerce backends</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Commerce logic and APIs without a fixed front end — for teams building a custom
              storefront experience while reusing proven cart, tax, and order infrastructure.
            </p>
            <Link href="/products?subcategory=headless-commerce-backends" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse headless backends <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">What separates a real store template from a design mockup</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Plenty of e-commerce templates look finished in a screenshot and fall apart the moment you
          try to take a real order. Every listing in this category is reviewed for the parts that
          actually matter.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'A working checkout flow, tested end-to-end, not just a styled cart page',
            'Tax, shipping, and discount logic that\'s actually implemented',
            'A documented data model so adding your own products doesn\'t require reverse-engineering the schema',
            'Webhook handling for payment confirmation and order status updates',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed e-commerce templates</h2>
            <Link href="/products?category=ecommerce" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => <ProductCard key={p.id} repo={p} />)}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="container max-w-3xl">
          <h2 className="mb-2 text-center font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mb-8 text-center text-muted-foreground">What buyers ask before purchasing an e-commerce template.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'E-Commerce Templates',
              description: 'Storefronts and headless commerce backends with checkout, catalog, and cart logic already built.',
              url: '/ecommerce',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/ai-marketing-copy-that-converts" className="text-sm font-medium text-primary hover:underline">AI marketing copy that converts &rarr;</Link></li>
          <li><Link href="/blog/pricing-ai-built-templates" className="text-sm font-medium text-primary hover:underline">How to price your AI-built templates &rarr;</Link></li>
          <li><Link href="/blog/ship-saas-in-a-weekend" className="text-sm font-medium text-primary hover:underline">How to ship a SaaS in a weekend &rarr;</Link></li>
          <li><Link href="/apps" className="text-sm font-medium text-primary hover:underline">Browse web apps &amp; SaaS &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
