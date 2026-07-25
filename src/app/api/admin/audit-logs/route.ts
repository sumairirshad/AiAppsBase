import { NextRequest, NextResponse } from 'next/server'
import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { listAuditLogs } from '@/lib/admin-data'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const { searchParams } = new URL(req.url)
  const { logs, total } = await listAuditLogs({
    action: searchParams.get('action') || undefined,
    targetType: searchParams.get('targetType') || undefined,
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 25,
  })

  return NextResponse.json({ logs, total })
}
