import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Product roadmap',
  description: 'See what we are building next and vote on the features that matter most to you. Transparency is a core value — our public roadmap board is on its way.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Product"
      title="Product roadmap"
      description="See what we are building next and vote on the features that matter most to you. Transparency is a core value — our public roadmap board is on its way."
      icon="Map"
      actions={[{ label: 'Request a feature', href: '/contact', variant: 'gradient' }, { label: 'View changelog', href: '/changelog', variant: 'outline' }]}
    />
  )
}
