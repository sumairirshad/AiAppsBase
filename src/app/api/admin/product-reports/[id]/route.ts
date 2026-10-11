import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const res = await query(
    `UPDATE product_reports SET status = 'resolved', resolved_by = $1, resolved_at = NOW()
     WHERE id = $2 AND status = 'open' RETURNING product_id`,
    [guard.id, params.id]
  )
  if ((res.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Report not found or already resolved' }, { status: 404 })
  }

  await logAdminAction({
    adminId: guard.id,
    action: 'product_report.resolved',
    targetType: 'product',
    targetId: res.rows[0].product_id,
    reason: 'Resolved product report',
    ipAddress: getClientIp(req),
  })

  return NextResponse.json({ ok: true })
}
