import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Security',
  description: 'Human-reviewed listings, Stripe-processed payments, bcrypt-hashed passwords, and httpOnly session cookies over HTTPS. Security is a feature, not an afterthought.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Security at AIAppsBase"
      description="Human-reviewed listings, Stripe-processed payments, bcrypt-hashed passwords, and httpOnly session cookies over HTTPS. Security is a feature, not an afterthought."
      icon="Info"
      actions={[{ label: 'Report an issue', href: 'mailto:security@aiappsbase.dev', variant: 'gradient' }, { label: 'Trust center', href: '/trust', variant: 'outline' }]}
    />
  )
}
