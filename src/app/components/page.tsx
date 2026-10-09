import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Box, Check, Layers, Puzzle } from 'lucide-react'

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
  title: 'AI-Built UI Components & Libraries — React, Tailwind & More',
  description:
    'Browse UI component libraries and design systems built with AI. Buttons, cards, modals, and full component sets for React, Vue, and Tailwind CSS.',
  keywords: [
    'AI UI components', 'React component library', 'Tailwind components',
    'AI design system', 'UI kit', 'Next.js components', 'component library',
  ],
  alternates: { canonical: '/components' },
  openGraph: {
    title: 'AI-Built UI Components & Libraries | AIAppsBase',
    description: 'UI component libraries and design systems for React, Vue, and Tailwind CSS — built with AI.',
    type: 'website',
    url: '/components',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built UI Components & Libraries | AIAppsBase',
    description: 'UI component libraries and design systems built with AI.',
  },
}

export const revalidate = 300

const faqItems = [
  {
    q: 'Which frameworks are these components built for?',
    a: 'Mostly React and Tailwind CSS, with some Vue listings. Each product page lists the exact framework, styling approach, and any dependencies before you buy.',
  },
  {
    q: 'Can I use these components in a commercial project?',
    a: 'Depends on the license tier you purchase — Personal, Commercial, or Extended Commercial. Commercial and above cover use in client or business projects; check the listing for exact terms.',
  },
  {
    q: 'Do component libraries come with documentation?',
    a: 'Most listings include a README or Storybook-style preview showing each component\'s props and variants. The product page links to a live demo so you can browse the components before buying.',
  },
  {
    q: 'What\'s the difference between a component library and a full design system?',
    a: 'A component library is a set of individual, reusable UI pieces (buttons, cards, modals). A design system additionally defines tokens, spacing, and usage guidelines so an entire product looks consistent when built on top of it.',
  },
]

export default async function ComponentsPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'components-ui').slice(0, 8)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Marketplace', href: '/products' }, { label: 'Components & UI Kits', href: '/components' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Box className="size-3" /> Components &amp; UI Kits</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Component libraries &amp; design systems, drop-in ready
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Production-ready UI components crafted with AI. Drop them into your React, Vue, or
          Tailwind project and skip weeks of building and testing primitives from scratch.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=components-ui">Browse all components <ArrowRight className="size-4" /></Link>
          </Button>
          <UploadCtaButton label="Upload components" size="lg" variant="outline" />
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <Layers className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Component libraries</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Buttons, cards, modals, forms, and the rest of the primitives a product needs —
              tested, accessible, and ready to import.
            </p>
            <Link href="/products?subcategory=component-libraries" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse component libraries <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Puzzle className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Design systems &amp; blocks</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tokens, spacing scales, and prebuilt page sections that keep an entire product
              visually consistent as it grows.
            </p>
            <Link href="/products?subcategory=design-systems" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse design systems <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Why buy components instead of building your own</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Accessible, well-tested UI primitives are deceptively time-consuming — keyboard
          navigation, focus states, and cross-browser quirks eat far more time than the happy path.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Full source code you own and can restyle freely',
            'Accessible by default — keyboard nav and focus states included',
            'A live, browsable demo of every component before you buy',
            'Reviewed for quality before it\'s listed',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed components</h2>
            <Link href="/products?category=components-ui" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">Everything buyers ask before purchasing components.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Components & UI Kits',
              description: 'UI component libraries and design systems for React, Vue, and Tailwind CSS — built with AI.',
              url: '/components',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/design-systems-that-sell" className="text-sm font-medium text-primary hover:underline">Design systems that sell &rarr;</Link></li>
          <li><Link href="/blog/ui-design-trends-shaped-by-ai-tools" className="text-sm font-medium text-primary hover:underline">UI design trends shaped by AI tools &rarr;</Link></li>
          <li><Link href="/templates" className="text-sm font-medium text-primary hover:underline">Browse website templates &rarr;</Link></li>
          <li><Link href="/apps" className="text-sm font-medium text-primary hover:underline">Browse web apps &amp; SaaS &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
