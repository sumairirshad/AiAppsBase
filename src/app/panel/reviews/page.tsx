import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Reviews' }

export default function Page() {
  return (
    <DashboardStub
      title="Reviews"
      description="Ratings and feedback from your customers."
      icon="Star"
      backHref="/panel"
    />
  )
}
