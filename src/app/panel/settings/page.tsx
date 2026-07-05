import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Settings' }

export default function Page() {
  return (
    <DashboardStub
      title="Settings"
      description="Profile, security, API tokens, and connected accounts."
      icon="Settings"
      backHref="/panel"
    />
  )
}
