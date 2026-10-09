import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Globe, Image as ImageIcon, LayoutTemplate, Newspaper } from 'lucide-react'

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
  title: 'AI-Built Website Templates — Landing Pages, Portfolios & More',
  description:
    'Browse premium website templates built with AI tools like ChatGPT, Claude, v0, and Cursor. Ready-to-use landing pages, portfolio sites, and business websites.',
  keywords: [
    'AI website templates', 'HTML templates', 'Next.js templates',
    'landing page templates', 'portfolio templates', 'AI-built website',
  ],
  alternates: { canonical: '/templates' },
  openGraph: {
    title: 'AI-Built Website Templates | AIAppsBase',
    description:
      'Premium landing pages, portfolios, and business websites crafted with AI. Download and ship faster than ever.',
    type: 'website',
    url: '/templates',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Website Templates | AIAppsBase',
    description: 'Premium landing pages, portfolios, and business websites crafted with AI.',
  },
}

export const revalidate = 300

const faqItems = [
  {
    q: 'What\'s included when I buy a website template?',
    a: 'The full source code as a ZIP file — HTML/CSS or a framework project (Next.js, React, etc.) depending on the listing. Each product page specifies the exact stack, what\'s included, and the license tier before you buy.',
  },
  {
    q: 'Can I customize the template after purchasing?',
    a: 'Yes. You receive the complete source, not a locked theme — rebrand colors and copy, swap sections, or restructure pages freely under your license tier\'s terms.',
  },
  {
    q: 'Do these templates come with a live demo?',
    a: 'Every listing links to a working preview so you can see exactly what you\'re buying — layout, animations, and responsiveness — before checkout.',
  },
  {
    q: 'What\'s the difference between Personal, Commercial, and Extended Commercial licenses?',
    a: 'Personal covers a single non-commercial project. Commercial lets you use the template in a client or business project. Extended Commercial additionally allows resale or redistribution as part of a larger product — check each listing for its exact terms.',
  },
]

export default async function TemplatesPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'websites').slice(0, 8)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Marketplace', href: '/products' }, { label: 'Website Templates', href: '/templates' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><LayoutTemplate className="size-3" /> Website Templates</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Landing pages, portfolios &amp; blogs, ready to launch
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Premium website templates crafted with AI tools — reviewed, demo-tested, and ready to
          customize. Download the source, swap in your brand, and deploy in minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=websites">Browse all templates <ArrowRight className="size-4" /></Link>
          </Button>
          <UploadCtaButton label="Upload a template" size="lg" variant="outline" />
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="p-6">
            <Globe className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Landing pages &amp; marketing</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Product launches, SaaS marketing sites, and campaign pages built to convert, with
              sections you can rearrange in minutes.
            </p>
            <Link href="/products?subcategory=landing-pages" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse landing pages <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <ImageIcon className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Portfolio templates</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Designer, developer, and agency portfolios with case-study layouts and project
              galleries already wired up.
            </p>
            <Link href="/products?subcategory=portfolio-templates" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse portfolios <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Newspaper className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Blog &amp; content sites</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Editorial layouts with category pages, author bios, and reading-friendly typography
              out of the box.
            </p>
            <Link href="/products?subcategory=blog-sites" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse blog sites <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Why buy a template instead of building from scratch</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          A polished website takes longer to get right than it should — layout, responsiveness,
          and the dozens of small details that make a site feel finished.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Full source code, not a locked page builder theme',
            'A live, working demo so you know exactly what you\'re getting',
            'Reviewed for quality before it\'s listed',
            'Responsive layouts that work on mobile out of the box',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed templates</h2>
            <Link href="/products?category=websites" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">Everything buyers ask before purchasing a template.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Website Templates',
              description: 'Premium landing pages, portfolios, and business websites crafted with AI.',
              url: '/templates',
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
          <li><Link href="/blog/pricing-ai-built-templates" className="text-sm font-medium text-primary hover:underline">How to price an AI-built template &rarr;</Link></li>
          <li><Link href="/apps" className="text-sm font-medium text-primary hover:underline">Browse web apps &amp; SaaS &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
