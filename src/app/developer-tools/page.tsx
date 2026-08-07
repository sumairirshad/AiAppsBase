import type { Metadata } from 'next'
import Link from 'next/link'
import { Terminal, Wrench, Cog, ArrowRight, Check } from 'lucide-react'

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
  title: 'Developer Tools & Scripts — CLI Tools & Automation Utilities',
  description:
    'Buy AI-built CLI tools, DevOps scripts, and automation utilities. Reviewed source code for developers who need working tools, not another framework to learn.',
  alternates: { canonical: '/developer-tools' },
  keywords: [
    'CLI tool source code', 'DevOps automation script', 'developer tools marketplace',
    'AI-built CLI tool', 'automation script for sale', 'buy developer scripts',
  ],
  openGraph: {
    title: 'Developer Tools & Scripts — CLI Tools & Automation Utilities',
    description: 'CLI tools and DevOps automation scripts, reviewed and demo-tested.',
    type: 'website',
    url: '/developer-tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Tools & Scripts — CLI Tools & Automation Utilities',
    description: 'CLI tools and DevOps automation scripts, reviewed and demo-tested.',
  },
}

const faqItems = [
  {
    q: 'What kind of tools are listed in this category?',
    a: 'Command-line tools, build and deployment scripts, monitoring and alerting utilities, and other developer-facing automation — anything that solves a specific operational problem rather than a full end-user application.',
  },
  {
    q: 'Are these tools tied to a specific cloud provider or CI system?',
    a: 'Some are, some aren\'t — check the tech stack tags on each listing. Many CLI tools are provider-agnostic by design; DevOps scripts are more likely to assume a specific stack (GitHub Actions, AWS, Docker), which the listing description should state clearly.',
  },
  {
    q: 'Can I see how a CLI tool behaves before I buy it?',
    a: 'Most listings include a terminal recording or a documented example of the exact commands and output, since a live browser preview doesn\'t make sense for a command-line tool. Look for this in the product gallery before purchasing.',
  },
  {
    q: 'Do sellers provide support if a script doesn\'t work with my specific setup?',
    a: 'Sellers are expected to respond to reasonable support questions during the buyer-protection window. If a tool genuinely doesn\'t work as documented for a supported environment, that qualifies for the standard refund process.',
  },
]

export default async function DeveloperToolsPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'scripts-tools').slice(0, 6)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Developer Tools', href: '/developer-tools' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Terminal className="size-3" /> Developer Tools &amp; Scripts</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          CLI tools and automation scripts built to solve one problem well
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          No bloated frameworks to learn — just working command-line tools and DevOps automation
          scripts you can read in an afternoon and drop straight into your workflow.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=scripts-tools">Browse developer tools <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">List your tool</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <Wrench className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">CLI tools</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Focused command-line utilities — code generators, linters, data-conversion tools,
              and productivity scripts built to be installed once and used daily.
            </p>
            <Link href="/products?subcategory=cli-tools" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse CLI tools <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Cog className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Automation &amp; DevOps scripts</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Deployment pipelines, monitoring and alerting scripts, and infrastructure automation
              built to remove a specific piece of manual ops work from your week.
            </p>
            <Link href="/products?subcategory=automation-devops" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse automation scripts <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">What makes a developer tool listing trustworthy</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Scripts that touch your infrastructure or CI pipeline deserve more scrutiny than a
          front-end template. Here's what we check, and what you should too.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Readable source with no obfuscation — you should be able to audit exactly what it does',
            'Explicit documentation of required permissions, API keys, or environment access',
            'A changelog showing the tool is still maintained against current tool versions',
            'Clear scope — a tool that does one thing well beats one that promises to do everything',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed developer tools</h2>
            <Link href="/products?category=scripts-tools" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">What buyers ask before purchasing a developer tool or script.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Developer Tools & Scripts',
              description: 'CLI tools and DevOps automation scripts, reviewed and demo-tested.',
              url: '/developer-tools',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/prompt-engineering-for-developers" className="text-sm font-medium text-primary hover:underline">Prompt engineering for developers &rarr;</Link></li>
          <li><Link href="/blog/automating-your-business-with-ai-agents" className="text-sm font-medium text-primary hover:underline">Automating your business with AI agents &rarr;</Link></li>
          <li><Link href="/blog/github-native-delivery" className="text-sm font-medium text-primary hover:underline">How GitHub-native delivery works under the hood &rarr;</Link></li>
          <li><Link href="/ai-projects" className="text-sm font-medium text-primary hover:underline">Browse AI projects &amp; LLM agents &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
