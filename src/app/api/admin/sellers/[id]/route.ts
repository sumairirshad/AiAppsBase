import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'suspended', 'banned']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sellerStatus, reason, notes } = body as { sellerStatus?: string; reason?: string; notes?: string }
  if (!sellerStatus || !VALID_STATUSES.includes(sellerStatus)) {
    return NextResponse.json({ error: 'Invalid provider status' }, { status: 400 })
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'A reason is required for this action' }, { status: 400 })
  }

  try {
    const existing = await query("SELECT id, full_name, seller_status FROM users WHERE id = $1 AND role = 'seller'", [params.id])
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    const updated = await query(
      `UPDATE users SET seller_status = $1 WHERE id = $2
       RETURNING id, full_name, email, seller_status, account_status, created_at`,
      [sellerStatus, params.id]
    )

    await logAdminAction({
      adminId: guard.id,
      action: `seller.status.${sellerStatus}`,
      targetType: 'seller',
      targetId: params.id,
      reason: reason.trim(),
      notes: notes?.trim() || null,
      previousValue: { sellerStatus: before.seller_status },
      newValue: { sellerStatus },
      ipAddress: getClientIp(req),
    })

    const s = updated.rows[0] as any
    return NextResponse.json({
      ok: true,
      seller: { id: s.id, name: s.full_name, email: s.email, sellerStatus: s.seller_status, accountStatus: s.account_status, memberSince: s.created_at },
    })
  } catch (error) {
    console.error('Admin seller update error:', error)
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
  }
}
