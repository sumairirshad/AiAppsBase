import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Earn with our affiliate program',
  description: 'Refer creators and buyers to AIAppsBase and earn recurring commission on every sale you drive. Sign-ups for the affiliate dashboard open soon.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Affiliates"
      title="Earn with our affiliate program"
      description="Refer creators and buyers to AIAppsBase and earn recurring commission on every sale you drive. Sign-ups for the affiliate dashboard open soon."
      icon="Share2"
      actions={[{ label: 'Join the program', href: '/auth/register', variant: 'gradient' }, { label: 'Contact us', href: '/contact', variant: 'outline' }]}
    />
  )
}
