import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  const featured = Boolean(body?.featured)

  const res = await query('UPDATE products SET featured = $1 WHERE id = $2 RETURNING id', [featured, params.id])
  if ((res.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await logAdminAction({
    adminId: guard.id,
    action: featured ? 'product.featured' : 'product.unfeatured',
    targetType: 'product',
    targetId: params.id,
    reason: featured ? 'Marked as featured' : 'Removed from featured',
    newValue: { featured },
    ipAddress: getClientIp(req),
  })

  return NextResponse.json({ ok: true, featured })
}
