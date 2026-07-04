import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Trust center',
  description: 'Everything we do to keep the marketplace safe and fair — from listing review and buyer protection to data handling and compliance.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Trust center"
      description="Everything we do to keep the marketplace safe and fair — from listing review and buyer protection to data handling and compliance."
      icon="Info"
      actions={[{ label: 'Security details', href: '/security', variant: 'gradient' }, { label: 'Privacy policy', href: '/privacy', variant: 'outline' }]}
    />
  )
}
