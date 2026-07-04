import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Join the community',
  description: 'Connect with thousands of creators and buyers. Swap feedback, share launches, and get early access to new features on our Discord and forums.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Community"
      title="Join the community"
      description="Connect with thousands of creators and buyers. Swap feedback, share launches, and get early access to new features on our Discord and forums."
      icon="Users"
      actions={[{ label: 'Join Discord', href: 'https://discord.com', variant: 'gradient' }, { label: 'Read the blog', href: '/blog', variant: 'outline' }]}
    />
  )
}
