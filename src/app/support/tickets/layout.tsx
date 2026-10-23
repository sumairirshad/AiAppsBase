import React from 'react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/shell'
import { requirePortalRole } from '@/lib/portal-access'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function SupportTicketsLayout({ children }: { children: React.ReactNode }) {
  // Support tickets work identically for buyers and sellers — gate only on
  // "signed in", and show whichever dashboard nav matches the user's actual
  // role so they can still get back to their own portal.
  const user = await requirePortalRole(['buyer', 'seller', 'admin'])
  return <DashboardShell role={user.role as 'buyer' | 'seller' | 'admin'}>{children}</DashboardShell>
}
