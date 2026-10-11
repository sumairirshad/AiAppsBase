import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

type DisputeResult =
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'invalid_status'; status: string }
  | { kind: 'disputed' }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (!reason) {
    return NextResponse.json({ error: 'Please describe the issue with this order' }, { status: 400 })
  }

  const result = await withTransaction<DisputeResult>(async (client) => {
    const oRes = await client.query(`SELECT id, status, buyer_id FROM orders WHERE id = $1 FOR UPDATE`, [params.id])
    if ((oRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    const order = oRes.rows[0]

    if (order.buyer_id !== userId) return { kind: 'forbidden' }
    if (order.status !== 'completed') return { kind: 'invalid_status', status: order.status }

    await client.query(
      `UPDATE orders SET status = 'disputed', dispute_reason = $1, disputed_at = NOW() WHERE id = $2`,
      [reason, params.id]
    )
    return { kind: 'disputed' }
  })

  switch (result.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    case 'forbidden':
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    case 'invalid_status':
      return NextResponse.json(
        { error: `This order can't be disputed right now (status: ${result.status})` },
        { status: 409 }
      )
    case 'disputed':
      return NextResponse.json({ ok: true, status: 'disputed' })
  }
}
