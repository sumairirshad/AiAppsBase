import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Developer documentation',
  description: 'Guides for listing repositories, wiring up GitHub sync, configuring payouts, and integrating the AIAppsBase API. The full docs site is being written by our DX team.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Documentation"
      title="Developer documentation"
      description="Guides for listing repositories, wiring up GitHub sync, configuring payouts, and integrating the AIAppsBase API. The full docs site is being written by our DX team."
      icon="BookOpen"
      actions={[{ label: 'Get support', href: '/support', variant: 'gradient' }, { label: 'View the API', href: '/api-docs', variant: 'outline' }]}
    />
  )
}
