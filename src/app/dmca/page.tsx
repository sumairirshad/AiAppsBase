import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'DMCA policy',
  description: 'How to report copyright infringement and how we handle takedown notices and counter-notices in accordance with the Digital Millennium Copyright Act.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="DMCA policy"
      description="How to report copyright infringement and how we handle takedown notices and counter-notices in accordance with the Digital Millennium Copyright Act."
      icon="Info"
      actions={[{ label: 'File a notice', href: 'mailto:dmca@aiappsbase.dev', variant: 'gradient' }, { label: 'Contact us', href: '/contact', variant: 'outline' }]}
    />
  )
}
