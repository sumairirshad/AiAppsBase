import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Orders & invoices' }

export default function Page() {
  return (
    <DashboardStub
      title="Orders & invoices"
      description="Your order history and downloadable invoices."
      icon="Receipt"
      backHref="/buyer"
    />
  )
}
