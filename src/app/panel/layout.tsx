import React from 'react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/shell'
import { requirePortalRole } from '@/lib/portal-access'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Buyers have their own portal and must not see the seller dashboard;
  // admins can view it for support. Unauthenticated visitors go to login.
  await requirePortalRole(['seller', 'admin'])
  return <DashboardShell role="seller">{children}</DashboardShell>
}
