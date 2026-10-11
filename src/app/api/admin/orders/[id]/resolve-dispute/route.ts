import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { refundOrder } from '@/lib/refunds'

type RejectResult =
  | { kind: 'not_found' }
  | { kind: 'not_disputed'; status: string }
  | { kind: 'rejected' }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  let action: string
  let reason: string
  try {
    const body = await req.json()
    action = body.action
    reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (action !== 'uphold' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "uphold" or "reject"' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'A resolution reason is required' }, { status: 400 })
  }

  if (action === 'uphold') {
    // Upholding a dispute is just a refund that also records how the
    // dispute was resolved — refundOrder() itself re-locks and re-verifies
    // the order isn't already refunded.
    const result = await refundOrder(params.id, reason)

    switch (result.kind) {
      case 'not_found':
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      case 'already_refunded':
        return NextResponse.json({ error: 'This order has already been refunded' }, { status: 409 })
      case 'no_payment_intent':
        return NextResponse.json(
          { error: 'This order has no linked Stripe payment and cannot be refunded automatically' },
          { status: 400 }
        )
      case 'stripe_failed':
        return NextResponse.json({ error: `Refund failed: ${result.message}` }, { status: 502 })
      case 'refunded': {
        await withTransaction((client) =>
          client.query(
            `UPDATE orders SET dispute_resolution = 'upheld', dispute_resolved_at = NOW() WHERE id = $1`,
            [params.id]
          )
        )
        await logAdminAction({
          adminId: guard.id,
          action: 'order.dispute.upheld',
          targetType: 'order',
          targetId: params.id,
          reason,
          newValue: { status: 'refunded', amount: result.amount, sellerId: result.sellerId, stripeRefundId: result.stripeRefundId },
          ipAddress: getClientIp(req),
        })
        return NextResponse.json({ ok: true, status: 'refunded' })
      }
    }
  }

  // Reject: the order goes back to completed — the buyer keeps the product,
  // nothing is refunded.
  const result = await withTransaction<RejectResult>(async (client) => {
    const oRes = await client.query(`SELECT id, status FROM orders WHERE id = $1 FOR UPDATE`, [params.id])
    if ((oRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    if (oRes.rows[0].status !== 'disputed') return { kind: 'not_disputed', status: oRes.rows[0].status }

    await client.query(
      `UPDATE orders SET status = 'completed', dispute_resolution = 'rejected', dispute_resolved_at = NOW() WHERE id = $1`,
      [params.id]
    )
    return { kind: 'rejected' }
  })

  switch (result.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    case 'not_disputed':
      return NextResponse.json(
        { error: `This order is not currently disputed (status: ${result.status})` },
        { status: 409 }
      )
    case 'rejected':
      await logAdminAction({
        adminId: guard.id,
        action: 'order.dispute.rejected',
        targetType: 'order',
        targetId: params.id,
        reason,
        newValue: { status: 'completed' },
        ipAddress: getClientIp(req),
      })
      return NextResponse.json({ ok: true, status: 'completed' })
  }
}
