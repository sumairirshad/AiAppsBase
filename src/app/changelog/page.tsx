import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every improvement, fix, and new feature we ship — in one place. Subscribe to the newsletter to get the highlights in your inbox each month.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Product"
      title="Changelog"
      description="Every improvement, fix, and new feature we ship — in one place. Subscribe to the newsletter to get the highlights in your inbox each month."
      icon="GitCommitHorizontal"
      actions={[{ label: 'See what we shipped', href: '/', variant: 'gradient' }, { label: 'View roadmap', href: '/roadmap', variant: 'outline' }]}
    />
  )
}
