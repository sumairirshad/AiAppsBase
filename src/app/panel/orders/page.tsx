import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Orders' }

export default function Page() {
  return (
    <DashboardStub
      title="Orders"
      description="Every sale, refund, and payout across your store."
      icon="ShoppingBag"
      backHref="/panel"
    />
  )
}
