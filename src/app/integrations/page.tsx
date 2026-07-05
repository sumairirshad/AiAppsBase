import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Connect your stack',
  description: 'Stripe, GitHub, Slack, Discord, Zapier, and more — plug AIAppsBase into the tools you already use. Our integrations directory is expanding fast.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Integrations"
      title="Connect your stack"
      description="Stripe, GitHub, Slack, Discord, Zapier, and more — plug AIAppsBase into the tools you already use. Our integrations directory is expanding fast."
      icon="Layers"
      actions={[{ label: 'Browse marketplace', href: '/products', variant: 'gradient' }, { label: 'Request an integration', href: '/contact', variant: 'outline' }]}
    />
  )
}
