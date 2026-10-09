import React from 'react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/shell'
import { requirePortalRole } from '@/lib/portal-access'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  // Sellers have their own portal and must not see the buyer dashboard;
  // admins can view it for support. Unauthenticated visitors go to login.
  await requirePortalRole(['buyer', 'admin'])
  return <DashboardShell role="buyer">{children}</DashboardShell>
}
