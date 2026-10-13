import type { Metadata } from 'next'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/icon'
import { query } from '@/lib/db'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'System status',
  description: 'What AIAppsBase monitors across the marketplace, payments, and integrations, and how to report a problem.',
}

const components = [
  { name: 'Marketplace & dashboard', description: 'Browsing, listings, buyer and seller dashboards.' },
  { name: 'Checkout & payments', description: 'Stripe-powered checkout, webhooks, and seller payouts via Stripe Connect.' },
  { name: 'GitHub integration', description: 'Repository sync, OAuth sign-in, and repo-backed product delivery.' },
  { name: 'Email delivery', description: 'Verification codes, password resets, receipts, and payout/moderation notices, sent via Resend.' },
  { name: 'File delivery', description: 'Deliverable and product-image storage served from our SFTP-backed storage.' },
]

const sections = [
  {
    title: 'What this page covers',
    content: `AIAppsBase does not currently run a public, continuously updated status/incident dashboard with historical uptime numbers. This page instead lists the components that make up the platform so you know what to check when something looks wrong, and how to reach us.`,
  },
  {
    title: 'If something looks down',
    content: `Check whether the issue is isolated to one action (a single purchase, a single listing) or platform-wide. For anything payment-related, Stripe's own status page (status.stripe.com) is a useful second data point, since checkout and payouts depend on it. If you suspect a platform-wide outage, contact support with what you were doing, the approximate time, and any error message you saw.`,
  },
]

export default function Page() {
  return (
    <InfoPage
      eyebrow="Reliability"
      title="System status"
      description="What AIAppsBase monitors across the marketplace, payments, and integrations, and how to report a problem."
      icon="Activity"
      actions={[{ label: 'Contact support', href: '/support', variant: 'gradient' }]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold">Components</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {components.map((c) => (
              <div key={c.name} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </section>
        {sections.map(({ title, content }) => (
          <section key={title}>
            <h2 className="mb-3 text-base font-semibold">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{content}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  )
}
