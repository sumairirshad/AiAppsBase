import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

const VALID_STATUSES = ['active', 'suspended', 'blocked', 'banned', 'inactive']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { accountStatus, reason, notes } = body as { accountStatus?: string; reason?: string; notes?: string }
  if (!accountStatus || !VALID_STATUSES.includes(accountStatus)) {
    return NextResponse.json({ error: 'Invalid account status' }, { status: 400 })
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'A reason is required for this action' }, { status: 400 })
  }

  try {
    const existing = await query('SELECT id, full_name, account_status FROM users WHERE id = $1', [params.id])
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    if (before.id === guard.id && accountStatus !== 'active') {
      return NextResponse.json({ error: 'You cannot change your own account status' }, { status: 400 })
    }

    const updated = await query(
      `UPDATE users SET account_status = $1 WHERE id = $2
       RETURNING id, full_name, email, role, is_verified, account_status, seller_status, created_at`,
      [accountStatus, params.id]
    )

    await logAdminAction({
      adminId: guard.id,
      action: `user.account_status.${accountStatus}`,
      targetType: 'user',
      targetId: params.id,
      reason: reason.trim(),
      notes: notes?.trim() || null,
      previousValue: { accountStatus: before.account_status },
      newValue: { accountStatus },
      ipAddress: getClientIp(req),
    })

    const u = updated.rows[0] as any
    return NextResponse.json({
      ok: true,
      user: {
        id: u.id, name: u.full_name, email: u.email, role: u.role, isVerified: u.is_verified,
        accountStatus: u.account_status, sellerStatus: u.seller_status, memberSince: u.created_at,
      },
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
