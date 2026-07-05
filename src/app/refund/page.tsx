import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Refund policy',
  description: 'Purchases are covered by a 14-day buyer-protection window. If a product is materially misrepresented or broken, you can request a refund and our team will mediate.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Refund policy"
      description="Purchases are covered by a 14-day buyer-protection window. If a product is materially misrepresented or broken, you can request a refund and our team will mediate."
      icon="LifeBuoy"
      actions={[{ label: 'Request a refund', href: '/support', variant: 'gradient' }, { label: 'Read terms', href: '/terms', variant: 'outline' }]}
    />
  )
}
