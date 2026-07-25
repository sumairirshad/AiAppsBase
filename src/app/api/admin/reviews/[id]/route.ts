import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => ({}))
  const { reason, notes } = body as { reason?: string; notes?: string }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'A reason is required to delete a review' }, { status: 400 })
  }

  try {
    const existing = await query(
      `SELECT r.id, r.rating, r.comment, p.title AS product
       FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.id = $1`,
      [params.id]
    )
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    await query('DELETE FROM reviews WHERE id = $1', [params.id])

    await logAdminAction({
      adminId: guard.id,
      action: 'review.delete',
      targetType: 'review',
      targetId: params.id,
      reason: reason.trim(),
      notes: notes?.trim() || null,
      previousValue: { rating: before.rating, comment: before.comment, product: before.product },
      ipAddress: getClientIp(req),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin review delete error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
