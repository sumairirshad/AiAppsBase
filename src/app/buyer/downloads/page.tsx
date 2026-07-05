import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Downloads' }

export default function Page() {
  return (
    <DashboardStub
      title="Downloads"
      description="Every file and repository you have access to."
      icon="Download"
      backHref="/buyer"
    />
  )
}
