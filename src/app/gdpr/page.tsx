import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'GDPR & data protection',
  description: 'How AIAppsBase collects, processes, and protects personal data under the GDPR, and how you can exercise your rights as a data subject.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="GDPR & data protection"
      description="How AIAppsBase collects, processes, and protects personal data under the GDPR, and how you can exercise your rights as a data subject."
      icon="Info"
      actions={[{ label: 'Privacy policy', href: '/privacy', variant: 'gradient' }, { label: 'Contact DPO', href: 'mailto:privacy@aiappsbase.dev', variant: 'outline' }]}
    />
  )
}
