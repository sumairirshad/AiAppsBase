import { NextRequest, NextResponse } from 'next/server'
import { withTransaction } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { stripe } from '@/lib/stripe'

type RefundResult =
  | { kind: 'not_found' }
  | { kind: 'already_refunded' }
  | { kind: 'no_payment_intent' }
  | { kind: 'refunded'; amount: number; sellerId: string; stripeRefundId: string }
  | { kind: 'stripe_failed'; message: string }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  let reason: string
  let notes: string | undefined
  try {
    const body = await req.json()
    reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    notes = typeof body.notes === 'string' ? body.notes.trim() : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'A refund reason is required' }, { status: 400 })
  }

  // Lock the order row for the whole refund (Stripe call included) so a
  // doubly-clicked refund button can never issue two Stripe refunds or flip
  // the order's status twice.
  const result = await withTransaction<RefundResult>(async (client) => {
    const oRes = await client.query(
      `SELECT o.id, o.status, o.amount::float AS amount, o.stripe_payment_intent_id, p.seller_id
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.id = $1 FOR UPDATE OF o`,
      [params.id]
    )
    if ((oRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    const order = oRes.rows[0]

    if (order.status === 'refunded') return { kind: 'already_refunded' }
    if (!order.stripe_payment_intent_id) return { kind: 'no_payment_intent' }

    try {
      const refund = await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
      await client.query(
        `UPDATE orders SET status = 'refunded', refunded_at = NOW(), refund_reason = $1 WHERE id = $2`,
        [reason, params.id]
      )
      return { kind: 'refunded', amount: Number(order.amount), sellerId: order.seller_id, stripeRefundId: refund.id }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[admin/orders/refund] stripe refund failed:', message, err)
      return { kind: 'stripe_failed', message }
    }
  })

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
    case 'refunded':
      // Seller earnings reversal: the withdrawal balance query only sums
      // orders with status='completed', so this refund is excluded from the
      // seller's available balance going forward the moment it commits —
      // no separate "reverse earnings" step is needed.
      await logAdminAction({
        adminId: guard.id,
        action: 'order.refunded',
        targetType: 'order',
        targetId: params.id,
        reason,
        notes,
        newValue: { status: 'refunded', amount: result.amount, sellerId: result.sellerId, stripeRefundId: result.stripeRefundId },
        ipAddress: getClientIp(req),
      })
      return NextResponse.json({ ok: true, status: 'refunded' })
  }
}
