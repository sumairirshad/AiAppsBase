import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard/shell'
import { getCurrentUser } from '@/lib/dashboard'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'admin') redirect('/')

  return <DashboardShell role="admin">{children}</DashboardShell>
}
