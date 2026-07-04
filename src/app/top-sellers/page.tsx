import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Top sellers on AIAppsBase',
  description: 'Meet the developers turning their repositories into thriving businesses. Full creator leaderboards and public storefronts are rolling out with our seller directory.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Creators"
      title="Top sellers on AIAppsBase"
      description="Meet the developers turning their repositories into thriving businesses. Full creator leaderboards and public storefronts are rolling out with our seller directory."
      icon="Trophy"
      actions={[{ label: 'Browse the marketplace', href: '/products', variant: 'gradient' }, { label: 'Become a seller', href: '/auth/register', variant: 'outline' }]}
    />
  )
}
