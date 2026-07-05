import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'AIAppsBase for teams',
  description: 'Volume pricing, team seats, SSO, audit logs, and a dedicated account manager for organizations sourcing or selling code at scale. Let us tailor a plan for you.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Enterprise"
      title="AIAppsBase for teams"
      description="Volume pricing, team seats, SSO, audit logs, and a dedicated account manager for organizations sourcing or selling code at scale. Let us tailor a plan for you."
      icon="Building2"
      actions={[{ label: 'Talk to sales', href: '/contact', variant: 'gradient' }, { label: 'View pricing', href: '/pricing', variant: 'outline' }]}
    />
  )
}
