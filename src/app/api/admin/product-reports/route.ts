import { NextRequest, NextResponse } from 'next/server'
import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { listProductReports } from '@/lib/admin-data'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const { searchParams } = new URL(req.url)
  const { reports, total } = await listProductReports({
    status: searchParams.get('status') || undefined,
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
  })

  return NextResponse.json({ reports, total })
}
