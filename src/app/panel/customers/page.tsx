import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Customers' }

export default function Page() {
  return (
    <DashboardStub
      title="Customers"
      description="The buyers who purchased and followed your products."
      icon="Users"
      backHref="/panel"
    />
  )
}
