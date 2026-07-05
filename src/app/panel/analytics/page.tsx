import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Analytics' }

export default function Page() {
  return (
    <DashboardStub
      title="Analytics"
      description="Deep-dive metrics on traffic, conversion, and revenue."
      icon="BarChart3"
      backHref="/panel"
    />
  )
}
