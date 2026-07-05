import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'System status',
  description: 'Real-time uptime and incident history for the AIAppsBase platform, API, and payment processing. All systems are currently operational.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Reliability"
      title="System status"
      description="Real-time uptime and incident history for the AIAppsBase platform, API, and payment processing. All systems are currently operational."
      icon="Activity"
      actions={[{ label: 'Contact support', href: '/support', variant: 'gradient' }]}
    />
  )
}
