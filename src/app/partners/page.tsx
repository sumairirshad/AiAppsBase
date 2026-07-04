import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Partner with AIAppsBase',
  description: 'Agencies, tool-makers, and platforms — integrate with us or co-market to millions of developers. Our partner program is now accepting applications.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Partners"
      title="Partner with AIAppsBase"
      description="Agencies, tool-makers, and platforms — integrate with us or co-market to millions of developers. Our partner program is now accepting applications."
      icon="Handshake"
      actions={[{ label: 'Apply now', href: '/contact', variant: 'gradient' }, { label: 'Learn more', href: '/about', variant: 'outline' }]}
    />
  )
}
