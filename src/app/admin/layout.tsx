import React from 'react'
import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard/shell'
import { getCurrentUser } from '@/lib/dashboard'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'admin') redirect('/')

  return <DashboardShell role="admin">{children}</DashboardShell>
}
