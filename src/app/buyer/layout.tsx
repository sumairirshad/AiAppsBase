import React from 'react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/shell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="buyer">{children}</DashboardShell>
}
