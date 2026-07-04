import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'The AIAppsBase API',
  description: 'A REST API for listings, orders, payouts, and webhooks so you can build on top of the marketplace. Public endpoints and API keys are launching alongside our developer platform.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Developers"
      title="The AIAppsBase API"
      description="A REST API for listings, orders, payouts, and webhooks so you can build on top of the marketplace. Public endpoints and API keys are launching alongside our developer platform."
      icon="Terminal"
      actions={[{ label: 'Read the docs', href: '/docs', variant: 'gradient' }, { label: 'Talk to us', href: '/contact', variant: 'outline' }]}
    />
  )
}
