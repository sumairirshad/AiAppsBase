import type { Metadata } from 'next'
import Link from 'next/link'
import { Puzzle, Boxes, Wrench, ArrowRight, Check } from 'lucide-react'

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
  title: 'AI-Built Browser Extensions — Chrome & Firefox Extension Templates',
  description:
    'Buy AI-built browser extensions and extension boilerplates for Chrome and Firefox. Manifest V3 ready, reviewed source code, working demos.',
  alternates: { canonical: '/browser-extensions' },
  keywords: [
    'browser extension template', 'Chrome extension boilerplate', 'Manifest V3 template',
    'AI-built browser extension', 'Firefox extension source code', 'buy chrome extension code',
  ],
  openGraph: {
    title: 'AI-Built Browser Extensions — Chrome & Firefox Extension Templates',
    description: 'Manifest V3-ready browser extension boilerplates and finished real-world extensions.',
    type: 'website',
    url: '/browser-extensions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Browser Extensions — Chrome & Firefox Extension Templates',
    description: 'Manifest V3-ready browser extension boilerplates and finished real-world extensions.',
  },
}

const faqItems = [
  {
    q: 'Are these extensions built for Manifest V3?',
    a: 'Yes — listings are reviewed for compatibility with Chrome\'s Manifest V3 requirements, since Manifest V2 extensions have been phased out of the Chrome Web Store. Check the individual product page for exact browser support (Chrome, Firefox, or both).',
  },
  {
    q: 'Can I sell an extension I\'ve already published to the Chrome Web Store?',
    a: 'Yes, many sellers list the source code for an extension that\'s already live, either as a boilerplate for others to build on or as a finished tool with an established user base and revenue history.',
  },
  {
    q: 'What\'s the difference between a boilerplate and a real-world extension listing?',
    a: 'Extension boilerplates give you the scaffolding — manifest config, build tooling, message passing between background and content scripts — so you can build your own idea faster. Real-world extensions are finished, specific tools (a productivity tracker, a price checker, a writing assistant) ready to use or rebrand.',
  },
  {
    q: 'Do I need to resubmit a purchased extension to the Chrome Web Store myself?',
    a: 'Yes — you\'ll publish under your own developer account. The template gets you working, reviewable code; store submission and the $5 one-time Chrome Web Store developer fee are handled by you directly with Google.',
  },
]

export default async function BrowserExtensionsPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'browser-extensions').slice(0, 6)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Browser Extensions', href: '/browser-extensions' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Puzzle className="size-3" /> Browser Extensions</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Browser extension code that’s already Manifest V3-ready
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Extension boilerplates and finished, real-world Chrome &amp; Firefox extensions — content
          scripts, background workers, and popup UI already wired together, so you’re not
          debugging manifest permissions on day one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=browser-extensions">Browse extensions <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">List your extension</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <Boxes className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Extension boilerplates &amp; frameworks</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manifest config, build tooling, and message-passing between background and content
              scripts already set up — start writing your extension’s actual feature on day one.
            </p>
            <Link href="/products?subcategory=extension-boilerplates" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse boilerplates <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Wrench className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Real-world extensions</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Finished, specific tools — productivity trackers, writing assistants, price checkers —
              ready to use, rebrand, or extend with your own features.
            </p>
            <Link href="/products?subcategory=real-world-extensions" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse finished extensions <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">What to look for before buying extension code</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Extension review requirements change often enough that outdated boilerplates are a real
          risk. Here’s what separates a listing worth buying from one that’ll get rejected
          at submission.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Manifest V3 compliance, not a V2 extension nearing end-of-life',
            'Clear permission scoping — extensions that request more access than they use get flagged in review',
            'A documented build step for packaging the extension for store submission',
            'A working demo (screen recording or an unpacked-extension install guide) before you buy',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed extensions</h2>
            <Link href="/products?category=browser-extensions" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">What buyers ask before purchasing browser extension code.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Browser Extensions',
              description: 'Manifest V3-ready browser extension boilerplates and finished real-world extensions.',
              url: '/browser-extensions',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/prompt-engineering-for-developers" className="text-sm font-medium text-primary hover:underline">Prompt engineering for developers &rarr;</Link></li>
          <li><Link href="/blog/ai-productivity-workflow-for-solo-founders" className="text-sm font-medium text-primary hover:underline">The AI productivity stack I actually use &rarr;</Link></li>
          <li><Link href="/developer-tools" className="text-sm font-medium text-primary hover:underline">Browse developer tools &amp; scripts &rarr;</Link></li>
          <li><Link href="/components" className="text-sm font-medium text-primary hover:underline">Browse UI components &amp; design systems &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
