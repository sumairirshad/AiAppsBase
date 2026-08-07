import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

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
    const existing = await query('SELECT id, title, status FROM products WHERE id = $1', [params.id])
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    await query('UPDATE products SET status = $1 WHERE id = $2', [status, params.id])

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

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
