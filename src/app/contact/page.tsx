import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Get in touch',
  description: 'Questions about buying, selling, partnerships, or press? Our team typically replies within one business day. Reach us at hello@aiappsbase.dev.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Get in touch"
      description="Questions about buying, selling, partnerships, or press? Our team typically replies within one business day. Reach us at hello@aiappsbase.dev."
      icon="Mail"
      actions={[{ label: 'Email us', href: 'mailto:hello@aiappsbase.dev', variant: 'gradient' }, { label: 'Visit help center', href: '/support', variant: 'outline' }]}
    />
  )
}
