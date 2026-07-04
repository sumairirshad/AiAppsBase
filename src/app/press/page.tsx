import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Press & media',
  description: 'Logos, brand guidelines, screenshots, and company facts for journalists and creators. For interviews and press inquiries, reach press@aiappsbase.dev.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Press"
      title="Press & media"
      description="Logos, brand guidelines, screenshots, and company facts for journalists and creators. For interviews and press inquiries, reach press@aiappsbase.dev."
      icon="Megaphone"
      actions={[{ label: 'Email press', href: 'mailto:press@aiappsbase.dev', variant: 'gradient' }, { label: 'About us', href: '/about', variant: 'outline' }]}
    />
  )
}
