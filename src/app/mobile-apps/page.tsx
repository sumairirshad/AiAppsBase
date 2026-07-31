import type { Metadata } from 'next'
import Link from 'next/link'
import { Smartphone, Layers, Apple, ArrowRight, Check } from 'lucide-react'

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
  title: 'AI-Built Mobile App Templates — React Native, Flutter & Native',
  description:
    'Buy AI-built mobile app source code for React Native, Flutter, and native iOS & Android. Reviewed, demo-tested apps with working navigation, auth, and API layers.',
  alternates: { canonical: '/mobile-apps' },
  keywords: [
    'AI mobile app template', 'React Native template', 'Flutter app template',
    'iOS app source code', 'Android app template', 'cross-platform app boilerplate',
  ],
  openGraph: {
    title: 'AI-Built Mobile App Templates — React Native, Flutter & Native',
    description: 'React Native, Flutter, and native mobile app source code with working auth, navigation, and APIs.',
    type: 'website',
    url: '/mobile-apps',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Built Mobile App Templates — React Native, Flutter & Native',
    description: 'React Native, Flutter, and native mobile app source code with working auth, navigation, and APIs.',
  },
}

const faqItems = [
  {
    q: 'Can I preview a mobile app before buying it, the way I can with a website?',
    a: 'Most listings include screen-recording previews or an Expo/TestFlight link you can install on your own device. Look for the preview link on the product page — sellers who skip this see far fewer sales, so it\'s become close to standard practice.',
  },
  {
    q: 'Do these templates include backend infrastructure, or just the app itself?',
    a: 'It varies by listing. Many include a paired backend (often a simple API or a service like Supabase/Firebase already wired in); others are front-end only and expect you to connect your own API. Check the tech stack tags before purchasing.',
  },
  {
    q: 'What\'s the difference between cross-platform and native listings?',
    a: 'Cross-platform apps (React Native, Flutter) share one codebase across iOS and Android — faster to customize and ship on both platforms. Native listings are written directly in Swift or Kotlin, which can offer deeper platform integration at the cost of maintaining two codebases.',
  },
  {
    q: 'Will I need a developer account to publish an app I buy here?',
    a: 'Yes — publishing to the Apple App Store or Google Play requires your own developer account regardless of where the source code came from. The template gets you a working app; app store submission is a separate step you\'ll manage yourself.',
  },
]

export default async function MobileAppsPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'mobile-apps').slice(0, 6)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Mobile Apps', href: '/mobile-apps' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Smartphone className="size-3" /> Mobile Apps</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Mobile app source code, built and reviewed before you buy
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          React Native, Flutter, and native iOS &amp; Android source code with working navigation,
          authentication, and API integration already in place — skip the weeks of project setup
          and start customizing on day one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=mobile-apps">Browse mobile apps <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">List your mobile app</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <Layers className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Cross-platform (React Native / Flutter)</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              One codebase shipping to both iOS and Android — the fastest path to a live app on
              both app stores without maintaining two separate projects.
            </p>
            <Link href="/products?subcategory=cross-platform-mobile" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse cross-platform apps <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Apple className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Native iOS &amp; Android</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Swift and Kotlin source code for teams who need deeper platform integration than a
              cross-platform framework provides, or are extending an existing native codebase.
            </p>
            <Link href="/products?subcategory=native-mobile" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse native apps <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">What to check before buying a mobile app template</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Mobile code is harder to evaluate at a glance than a website — you can't just open a URL.
          These are the specific things worth confirming before you pay.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'An installable preview (Expo Go, TestFlight, or an APK) rather than screenshots alone',
            'Navigation and state management that\'s fully wired, not stubbed placeholder screens',
            'Clear documentation on required API keys and third-party services',
            'A recent update or changelog entry — mobile SDKs age faster than web frameworks',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed mobile apps</h2>
            <Link href="/products?category=mobile-apps" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">What buyers ask before purchasing a mobile app template.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Mobile App Templates',
              description: 'React Native, Flutter, and native mobile app source code with working auth, navigation, and APIs.',
              url: '/mobile-apps',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/ship-saas-in-a-weekend" className="text-sm font-medium text-primary hover:underline">How to ship a SaaS in a weekend &rarr;</Link></li>
          <li><Link href="/blog/best-ai-coding-assistants-compared" className="text-sm font-medium text-primary hover:underline">ChatGPT vs Claude vs Cursor vs v0 &rarr;</Link></li>
          <li><Link href="/blog/first-product-guide" className="text-sm font-medium text-primary hover:underline">A complete guide to selling your first product &rarr;</Link></li>
          <li><Link href="/apps" className="text-sm font-medium text-primary hover:underline">Browse web apps &amp; SaaS &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
