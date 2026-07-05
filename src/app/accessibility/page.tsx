import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'We build for everyone. AIAppsBase targets WCAG 2.1 AA — with keyboard navigation, screen-reader support, and sufficient contrast across light and dark themes.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Commitment"
      title="Accessibility"
      description="We build for everyone. AIAppsBase targets WCAG 2.1 AA — with keyboard navigation, screen-reader support, and sufficient contrast across light and dark themes."
      icon="Info"
      actions={[{ label: 'Report a barrier', href: '/contact', variant: 'gradient' }]}
    />
  )
}
