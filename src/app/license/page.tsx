import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'License agreement',
  description: 'The terms that govern how buyers may use products purchased on AIAppsBase, including Personal, Commercial, and Extended Commercial license tiers.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="License agreement"
      description="The terms that govern how buyers may use products purchased on AIAppsBase, including Personal, Commercial, and Extended Commercial license tiers."
      icon="BookOpen"
      actions={[{ label: 'Read terms', href: '/terms', variant: 'gradient' }, { label: 'Contact legal', href: 'mailto:legal@aiappsbase.dev', variant: 'outline' }]}
    />
  )
}
