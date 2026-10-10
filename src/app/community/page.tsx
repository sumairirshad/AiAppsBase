import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Connect with other creators and buyers, swap feedback, and get help from the AIAppsBase team.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Community"
      title="Community"
      description="Connect with other creators and buyers, swap feedback, and get help from the AIAppsBase team."
      icon="Users"
      actions={[{ label: 'Contact us', href: '/contact', variant: 'gradient' }, { label: 'Read the blog', href: '/blog', variant: 'outline' }]}
    />
  )
}
