import { withTransaction } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export type RefundResult =
  | { kind: 'not_found' }
  | { kind: 'already_refunded' }
  | { kind: 'no_payment_intent' }
  | { kind: 'refunded'; amount: number; sellerId: string; stripeRefundId: string }
  | { kind: 'stripe_failed'; message: string }

/**
 * Issues a Stripe refund for an order and marks it refunded, under a row
 * lock on the order so two refund attempts hitting at once — a doubly
 * clicked button, or a dispute being upheld at the same moment a plain
 * refund is issued — can never both go through.
 */
export async function refundOrder(orderId: string, reason: string): Promise<RefundResult> {
  return withTransaction<RefundResult>(async (client) => {
    const oRes = await client.query(
      `SELECT o.id, o.status, o.amount::float AS amount, o.stripe_payment_intent_id, p.seller_id
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.id = $1 FOR UPDATE OF o`,
      [orderId]
    )
    if ((oRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    const order = oRes.rows[0]

    if (order.status === 'refunded') return { kind: 'already_refunded' }
    if (!order.stripe_payment_intent_id) return { kind: 'no_payment_intent' }

    try {
      const refund = await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
      await client.query(
        `UPDATE orders SET status = 'refunded', refunded_at = NOW(), refund_reason = $1 WHERE id = $2`,
        [reason, orderId]
      )
      return { kind: 'refunded', amount: Number(order.amount), sellerId: order.seller_id, stripeRefundId: refund.id }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[refunds] stripe refund failed:', message, err)
      return { kind: 'stripe_failed', message }
    }
  })
}
