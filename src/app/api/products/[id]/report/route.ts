import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (!reason) {
    return NextResponse.json({ error: 'Please describe why you are reporting this product' }, { status: 400 })
  }
  if (reason.length > 2000) {
    return NextResponse.json({ error: 'Report is too long (2000 characters max)' }, { status: 400 })
  }

  const productRes = await query('SELECT id FROM products WHERE id = $1', [params.id])
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await query(
    `INSERT INTO product_reports (product_id, reporter_id, reason) VALUES ($1, $2, $3)`,
    [params.id, userId, reason]
  )

  return NextResponse.json({ ok: true })
}
