import React from 'react'
import { DashboardShell } from '@/components/dashboard/shell'

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="buyer">{children}</DashboardShell>
}
