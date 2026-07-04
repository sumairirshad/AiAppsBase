import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'

export const metadata: Metadata = {
  title: 'Build the future of code commerce',
  description: 'We are a small, senior team shipping fast and obsessing over craft. If you love developer tools and beautiful products, we would love to hear from you.',
}

export default function Page() {
  return (
    <InfoPage
      eyebrow="Careers"
      title="Build the future of code commerce"
      description="We are a small, senior team shipping fast and obsessing over craft. If you love developer tools and beautiful products, we would love to hear from you."
      icon="Briefcase"
      actions={[{ label: 'See open roles', href: '/contact', variant: 'gradient' }, { label: 'About us', href: '/about', variant: 'outline' }]}
    />
  )
}
