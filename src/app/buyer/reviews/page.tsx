import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Your reviews' }

export default function Page() {
  return (
    <DashboardStub
      title="Your reviews"
      description="Reviews you have written for your purchases."
      icon="Star"
      backHref="/buyer"
    />
  )
}
