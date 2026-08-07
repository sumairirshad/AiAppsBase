import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { Faq } from '@/components/seo/faq'
import { JsonLd } from '@/components/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Best AI Coding Tools Compared — ChatGPT, Claude, Cursor, v0 & More',
  description:
    'A practical, hands-on comparison of the best AI coding tools in 2026 — ChatGPT, Claude, Cursor, v0, Bolt, Windsurf, Replit Agent, and GitHub Copilot — and which one fits your workflow.',
  alternates: { canonical: '/best-ai-coding-tools' },
  keywords: [
    'best AI coding tools', 'ChatGPT vs Claude for coding', 'Cursor vs v0', 'AI coding assistant comparison',
    'best AI tool for developers', 'AI pair programming tools',
  ],
  openGraph: {
    title: 'Best AI Coding Tools Compared — ChatGPT, Claude, Cursor, v0 & More',
    description: 'A practical comparison of the best AI coding tools and which one fits your workflow.',
    type: 'website',
    url: '/best-ai-coding-tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best AI Coding Tools Compared — ChatGPT, Claude, Cursor, v0 & More',
    description: 'A practical comparison of the best AI coding tools and which one fits your workflow.',
  },
}

const tools = [
  {
    name: 'ChatGPT',
    bestFor: 'Working through unclear ideas, debugging pasted error messages, general architecture discussion',
    watchFor: 'No native awareness of your codebase — you have to paste in the relevant context yourself',
  },
  {
    name: 'Claude',
    bestFor: 'Large refactors, careful multi-file reasoning, building and reviewing LLM agent/RAG logic',
    watchFor: 'Best results come from giving it real project context, not one-line prompts',
  },
  {
    name: 'Cursor',
    bestFor: 'Day-to-day feature work inside an existing codebase, thanks to full-repo context awareness',
    watchFor: 'Assumes you\'re comfortable working directly in a code editor',
  },
  {
    name: 'v0 by Vercel',
    bestFor: 'Turning a description or screenshot into a clean, styled React UI in minutes',
    watchFor: 'Strongest on front-end layout; backend and data logic usually need a second pass elsewhere',
  },
  {
    name: 'Bolt.new',
    bestFor: 'Fast, in-browser full-stack prototyping with zero local setup required',
    watchFor: 'Best treated as a rapid first draft rather than a final production build',
  },
  {
    name: 'Lovable',
    bestFor: 'Non-technical founders taking an app idea from description to working prototype quickly',
    watchFor: 'A technical review pass matters before real users or payments touch the output',
  },
  {
    name: 'Windsurf',
    bestFor: 'Agentic, multi-step coding tasks handled directly inside an IDE-like flow',
    watchFor: 'Newer tool — check current model and feature support before committing a large project to it',
  },
  {
    name: 'Replit Agent',
    bestFor: 'Building and deploying a small app entirely in-browser, hosting included',
    watchFor: 'Best suited to smaller, self-contained projects rather than complex existing codebases',
  },
  {
    name: 'GitHub Copilot',
    bestFor: 'Inline autocomplete and small suggestions while you write code yourself, inside your existing editor',
    watchFor: 'Less suited to large, autonomous multi-file changes than agentic tools built for that purpose',
  },
]

const faqItems = [
  {
    q: 'What is the single best AI coding tool?',
    a: 'There isn\'t one — the tools are strong at different stages of building software. ChatGPT and Claude are best for reasoning and planning, Cursor and Windsurf for day-to-day work inside a real codebase, and v0, Bolt, Lovable, and Replit Agent for fast prototyping. Most experienced builders use more than one.',
  },
  {
    q: 'Which AI tool is best for someone with no coding experience?',
    a: 'v0, Bolt, and Lovable are built around plain-language descriptions producing a working interface, with nothing to install or configure locally — the most approachable starting point for a non-developer.',
  },
  {
    q: 'Can I sell a product built with these tools on AIAppsBase?',
    a: 'Yes — every listing on the marketplace discloses which AI tool was used and roughly how much of the code is AI-generated versus hand-edited. Buyers see this on every product page.',
  },
  {
    q: 'Do these AI tools replace the need to understand code?',
    a: 'No. They dramatically speed up getting to a working first version, but production readiness — security, edge cases, scale — still requires someone to review and understand what was generated before real users or money are involved.',
  },
]

export default function BestAiCodingToolsPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-16 text-center sm:py-20">
        <Breadcrumbs
          className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground"
          items={[{ label: 'Home', href: '/' }, { label: 'Best AI Coding Tools', href: '/best-ai-coding-tools' }]}
        />
        <Badge variant="brand" className="px-3 py-1"><Sparkles className="size-3" /> Guide</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          The best AI coding tools, compared honestly
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          We review thousands of listings built with every major AI coding tool. This is the plain,
          practical breakdown of where each one genuinely wins — not a ranked top-10 list.
        </p>
      </section>

      <section className="container max-w-4xl pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Card key={t.name} className="p-5">
              <h2 className="font-display text-lg font-semibold">{t.name}</h2>
              <p className="mt-2 text-sm"><span className="font-medium text-foreground">Best for: </span><span className="text-muted-foreground">{t.bestFor}</span></p>
              <p className="mt-1.5 text-sm"><span className="font-medium text-foreground">Watch for: </span><span className="text-muted-foreground">{t.watchFor}</span></p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container max-w-3xl pb-16">
        <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">How to actually choose</h2>
        <p className="mb-3 text-muted-foreground">
          Start from the stage of the work, not the tool's marketing. If you don't yet have a clear
          spec, a conversational model like ChatGPT or Claude will save you more time than an IDE
          integration. If you're deep in an existing codebase making daily changes, an editor-native
          tool like Cursor or Windsurf pays for itself in reduced context-switching. If you're
          starting completely from scratch and want to see something on screen in the next ten
          minutes, v0, Bolt, Lovable, or Replit Agent get you there fastest.
        </p>
        <p className="text-muted-foreground">
          For a deeper hands-on breakdown of ChatGPT, Claude, Cursor, and v0 specifically, read our
          full comparison on the blog — it goes into the technical tradeoffs that matter once you're
          past the first prototype.
        </p>
      </section>

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="container max-w-3xl">
          <h2 className="mb-2 text-center font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mb-8 text-center text-muted-foreground">Common questions about choosing an AI coding tool.</p>
          <JsonLd
            data={collectionPageSchema({
              name: 'Best AI Coding Tools Compared',
              description: 'A practical comparison of the best AI coding tools and which one fits your workflow.',
              url: '/best-ai-coding-tools',
            })}
          />
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Put any of these tools to work today</h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Browse thousands of listings built with ChatGPT, Claude, v0, Bolt, Cursor, and more —
          every one reviewed and disclosed, so you know exactly what you're buying.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/products">Browse the marketplace <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog/best-ai-coding-assistants-compared">Read the full comparison &rarr;</Link>
          </Button>
        </div>
        <ul className="mx-auto mt-10 grid max-w-2xl gap-2 text-left sm:grid-cols-2">
          <li><Link href="/ai-projects" className="text-sm font-medium text-primary hover:underline">Browse AI projects &amp; LLM agents &rarr;</Link></li>
          <li><Link href="/developer-tools" className="text-sm font-medium text-primary hover:underline">Browse developer tools &amp; scripts &rarr;</Link></li>
          <li><Link href="/blog/prompt-engineering-for-developers" className="text-sm font-medium text-primary hover:underline">Prompt engineering for developers &rarr;</Link></li>
          <li><Link href="/blog/vibe-coding-and-the-future-of-software" className="text-sm font-medium text-primary hover:underline">"Vibe coding" and the future of software &rarr;</Link></li>
        </ul>
      </section>
    </div>
  )
}
