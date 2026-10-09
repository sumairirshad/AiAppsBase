import React from 'react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/shell'
import { requirePortalRole } from '@/lib/portal-access'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Only admins may see the admin portal. Unauthenticated visitors go to
  // login; a signed-in buyer or seller is sent to their own portal instead.
  await requirePortalRole(['admin'])
  return <DashboardShell role="admin">{children}</DashboardShell>
}
