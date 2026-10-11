import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const response = typeof body?.response === 'string' ? body.response.trim() : ''
  if (!response) {
    return NextResponse.json({ error: 'Write a reply before submitting' }, { status: 400 })
  }
  if (response.length > 2000) {
    return NextResponse.json({ error: 'Reply is too long (2000 characters max)' }, { status: 400 })
  }

  // Only the seller of the product this review is on can reply to it.
  const reviewRes = await query<{ seller_id: string }>(
    `SELECT p.seller_id FROM reviews r JOIN products p ON r.product_id = p.id WHERE r.id = $1`,
    [params.id]
  )
  if ((reviewRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }
  if (reviewRes.rows[0].seller_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await query('UPDATE reviews SET seller_response = $1 WHERE id = $2', [response, params.id])
  return NextResponse.json({ ok: true, sellerResponse: response })
}
