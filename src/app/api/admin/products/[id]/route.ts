import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { sendModerationDecisionEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const { status, reason, notes } = await req.json()
  const allowed = ['approved', 'rejected', 'suspended', 'pending']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (!reason || !String(reason).trim()) {
    return NextResponse.json({ error: 'A reason is required for this action' }, { status: 400 })
  }

  try {
    const existing = await query(
      `SELECT p.id, p.title, p.status, u.email AS seller_email
       FROM products p JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [params.id]
    )
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    // Surface the reason to the seller for a rejection; clear any stale
    // reason once the product moves to any other status.
    const rejectionReason = status === 'rejected' ? String(reason).trim() : null
    await query('UPDATE products SET status = $1, rejection_reason = $2 WHERE id = $3', [
      status,
      rejectionReason,
      params.id,
    ])

    await logAdminAction({
      adminId: guard.id,
      action: `product.status.${status}`,
      targetType: 'product',
      targetId: params.id,
      reason: String(reason).trim(),
      notes: notes ? String(notes).trim() : null,
      previousValue: { status: before.status },
      newValue: { status },
      ipAddress: getClientIp(req),
    })

    if (status === 'approved' || status === 'rejected') {
      try {
        await sendModerationDecisionEmail(before.seller_email, {
          kind: 'product',
          status,
          title: before.title,
          reason: rejectionReason,
        })
      } catch (error) {
        console.error('[admin/products] Failed to send moderation decision email', params.id, error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
