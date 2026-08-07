import type { Metadata } from 'next'
import Link from 'next/link'
import { Bot, Sparkles, Workflow, BrainCircuit, ArrowRight, Check } from 'lucide-react'

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
  title: 'AI Projects for Sale — LLM Agents, RAG Apps & ML Frameworks',
  description:
    'Buy production-ready AI projects: LLM apps and agents, RAG pipelines, and machine learning frameworks built with ChatGPT, Claude, and other AI tools. Reviewed code with working demos.',
  alternates: { canonical: '/ai-projects' },
  keywords: [
    'AI projects for sale', 'LLM agent templates', 'RAG starter kit', 'AI agent boilerplate',
    'machine learning framework template', 'buy AI project source code',
  ],
  openGraph: {
    title: 'AI Projects for Sale — LLM Agents, RAG Apps & ML Frameworks',
    description: 'Production-ready LLM agents, RAG pipelines, and ML frameworks — reviewed and demo-tested.',
    type: 'website',
    url: '/ai-projects',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Projects for Sale — LLM Agents, RAG Apps & ML Frameworks',
    description: 'Production-ready LLM agents, RAG pipelines, and ML frameworks — reviewed and demo-tested.',
  },
}

const faqItems = [
  {
    q: 'What counts as an "AI Project" listing versus a regular app?',
    a: 'AI Projects are listings where AI is the core function, not just the build method — LLM-powered agents, retrieval-augmented generation (RAG) pipelines, chatbots, and machine learning frameworks. A SaaS dashboard built with ChatGPT still lists under Web Apps & SaaS; an autonomous agent that uses an LLM to make decisions belongs here.',
  },
  {
    q: 'Do these projects include the AI model, or just the code?',
    a: 'Listings include the application code — the agent logic, prompt orchestration, RAG pipeline, or model training scaffold. Most connect to a model provider (OpenAI, Anthropic, or an open-weight model you host) via your own API key, which is not included in the purchase price.',
  },
  {
    q: 'Are these projects safe to run in production without changes?',
    a: 'Every listing passes our review for a working demo and accurate description, but production readiness varies by project. Read the seller\'s documentation on rate limits, error handling, and cost controls before deploying an agent that takes real actions — our automation guide covers what to check first.',
  },
  {
    q: 'Can I customize the LLM provider an agent template uses?',
    a: 'Most agent and RAG templates on the marketplace use a swappable provider layer rather than hardcoding one API, precisely so buyers can switch between OpenAI, Anthropic, or a self-hosted model. Check the tech stack tags on a listing before buying if this matters for your use case.',
  },
]

export default async function AiProjectsPage() {
  const products = (await listApprovedProducts()).filter((p) => p.categorySlug === 'ai-projects').slice(0, 6)

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'AI Projects', href: '/ai-projects' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Bot className="size-3" /> AI Projects</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          LLM agents, RAG pipelines &amp; ML frameworks, ready to deploy
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Skip the weeks of orchestration plumbing. Every listing here is a working AI project —
          not a Jupyter notebook demo — with a live preview, documented prompts, and reviewed code
          you can extend for your own use case.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products?category=ai-projects">Browse all AI projects <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">List your AI project</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <BrainCircuit className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">LLM apps &amp; agents</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Autonomous and semi-autonomous agents, chat interfaces, and tool-using assistants —
              built on top of ChatGPT, Claude, or open-weight models, with the orchestration logic
              already wired up.
            </p>
            <Link href="/products?subcategory=llm-agents" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse LLM agents <ArrowRight className="size-3.5" />
            </Link>
          </Card>
          <Card className="p-6">
            <Workflow className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">ML &amp; deep learning frameworks</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Training pipelines, fine-tuning scaffolds, and model-serving frameworks for teams who
              need more than an API wrapper — the kind of infrastructure that usually takes an ML
              engineer weeks to assemble from scratch.
            </p>
            <Link href="/products?subcategory=ml-frameworks" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse ML frameworks <ArrowRight className="size-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">Why buy an AI project instead of building one</h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          Agent orchestration, retrieval pipelines, and evaluation harnesses are deceptively time-consuming
          to get right — most of the effort is in edge cases that only show up once real users start
          poking at it.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Working prompt orchestration and tool-calling logic, not just a single API call',
            'Swappable model providers so you\'re not locked into one vendor',
            'Documented rate limiting and cost controls, reviewed before listing',
            'A live, clickable demo so you can test agent behavior before you buy',
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
            <h2 className="font-display text-2xl font-bold tracking-tight">Recently listed AI projects</h2>
            <Link href="/products?category=ai-projects" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
          <p className="mb-8 text-center text-muted-foreground">Everything buyers ask before purchasing an AI project.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'AI Projects',
              description: 'Production-ready LLM agents, RAG pipelines, and ML frameworks — reviewed and demo-tested.',
              url: '/ai-projects',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Related reading</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li><Link href="/blog/automating-your-business-with-ai-agents" className="text-sm font-medium text-primary hover:underline">Automating your business with AI agents &rarr;</Link></li>
          <li><Link href="/blog/best-ai-coding-assistants-compared" className="text-sm font-medium text-primary hover:underline">ChatGPT vs Claude vs Cursor vs v0 &rarr;</Link></li>
          <li><Link href="/best-ai-coding-tools" className="text-sm font-medium text-primary hover:underline">Compare the best AI coding tools &rarr;</Link></li>
          <li><Link href="/developer-tools" className="text-sm font-medium text-primary hover:underline">Browse developer tools &amp; scripts &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
