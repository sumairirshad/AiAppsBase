import type { Metadata } from 'next'
import { DashboardStub } from '@/components/dashboard/stub'

export const metadata: Metadata = { title: 'Wallet & payouts' }

export default function Page() {
  return (
    <DashboardStub
      title="Wallet & payouts"
      description="Balance, withdrawals, and transaction history."
      icon="Wallet"
      backHref="/panel"
    />
  )
}
