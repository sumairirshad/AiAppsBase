import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FaqSection } from '@/components/landing/faq-section'
import { plans } from '@/lib/landing-data'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for AIAppsBase. Start free and only pay when you sell. Upgrade to Pro for lower fees and premium placement.',
}

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-96 w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30 mask-fade-b" />
      </div>

      <section className="container max-w-3xl py-20 text-center sm:py-24">
        <Badge variant="brand" className="px-3 py-1"><Sparkles className="size-3" /> Pricing</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Keep more of what you earn
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Start free and only pay when you sell. No listing fees, no surprises — upgrade any time
          for lower per-sale fees and premium placement.
        </p>
      </section>

      <section className="container -mt-6 pb-20">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={cn(
                'relative flex flex-col p-7',
                p.highlighted && 'border-primary/50 shadow-glow ring-1 ring-primary/30'
              )}
            >
              {p.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ {p.period}</span>
              </div>
              <Badge variant="muted" className="mt-3 w-fit">{p.fee}</Badge>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-7" variant={p.highlighted ? 'gradient' : 'outline'} asChild>
                <Link href="/auth/register">{p.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-20">
        <div className="container max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-bold tracking-tight">
            Pricing questions
          </h2>
          <FaqSection />
        </div>
      </section>
    </div>
  )
}
