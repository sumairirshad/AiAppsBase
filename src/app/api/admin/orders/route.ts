import { NextRequest, NextResponse } from 'next/server'
import { isAdminGuardError, requireAdmin } from '@/lib/admin'
import { listAdminOrders } from '@/lib/admin-data'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const { searchParams } = new URL(req.url)
  const { orders, total } = await listAdminOrders({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
  })

  return NextResponse.json({ orders, total })
}
