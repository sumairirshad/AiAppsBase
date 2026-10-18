import { withTransaction } from '@/lib/db'

/**
 * Documented dispute/chargeback policy:
 *
 *  - charge.dispute.created (a cardholder opened a dispute with their bank):
 *    the order is immediately moved out of 'completed' into 'disputed',
 *    which blocks further downloads through the existing download-route
 *    check (`order.status !== 'completed'`) — the same effect a buyer's own
 *    self-service dispute (POST /api/orders/[id]/dispute) already has. This
 *    errs toward protecting the seller/platform: a cardholder actively
 *    disputing the charge keeps downloading in the meantime otherwise.
 *
 *  - charge.dispute.closed with status 'won' (the merchant won — Stripe
 *    keeps the funds with the seller): the order is restored to
 *    'completed', exactly like an admin rejecting a dispute today
 *    (POST /api/admin/orders/[id]/resolve-dispute, action=reject/uphold).
 *
 *  - charge.dispute.closed with status 'lost' (the chargeback stands —
 *    Stripe has already reversed the charge on its own; there is no refund
 *    left to issue through stripe.refunds.create, and attempting one would
 *    either error or double-process): the order is marked 'refunded'
 *    directly, without calling the Stripe refund API, purely to reflect
 *    reality locally and keep access control consistent (refunded orders
 *    aren't downloadable).
 *
 * Both transitions are guarded by `FOR UPDATE` + a status check, so this is
 * safe to call more than once for the same event (webhook redelivery) or
 * even if it races a human admin action on the same order.
 */

async function findOrderIdByPaymentIntent(client: import('pg').PoolClient, paymentIntentId: string): Promise<string | null> {
  const res = await client.query<{ id: string }>(
    `SELECT id FROM orders WHERE stripe_payment_intent_id = $1 FOR UPDATE`,
    [paymentIntentId]
  )
  return res.rows[0]?.id ?? null
}

export async function handleStripeDisputeCreated(paymentIntentId: string | null, disputeReason: string | null): Promise<void> {
  if (!paymentIntentId) return
  await withTransaction(async (client) => {
    const orderId = await findOrderIdByPaymentIntent(client, paymentIntentId)
    if (!orderId) return

    const oRes = await client.query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [orderId])
    if (oRes.rows[0]?.status !== 'completed') return // already disputed/refunded — nothing to do

    await client.query(
      `UPDATE orders SET status = 'disputed', dispute_reason = $1, disputed_at = NOW() WHERE id = $2`,
      [`Stripe chargeback opened by the cardholder${disputeReason ? ` (reason: ${disputeReason})` : ''}.`, orderId]
    )
  })
}

export async function handleStripeDisputeClosed(paymentIntentId: string | null, outcome: 'won' | 'lost'): Promise<void> {
  if (!paymentIntentId) return
  await withTransaction(async (client) => {
    const orderId = await findOrderIdByPaymentIntent(client, paymentIntentId)
    if (!orderId) return

    const oRes = await client.query<{ status: string }>('SELECT status FROM orders WHERE id = $1', [orderId])
    const currentStatus = oRes.rows[0]?.status

    if (outcome === 'won') {
      if (currentStatus !== 'disputed') return
      await client.query(
        `UPDATE orders SET status = 'completed', dispute_resolution = 'rejected', dispute_resolved_at = NOW() WHERE id = $1`,
        [orderId]
      )
    } else {
      if (currentStatus === 'refunded') return
      await client.query(
        `UPDATE orders SET status = 'refunded', refunded_at = NOW(),
           refund_reason = 'Stripe chargeback upheld against the seller.',
           dispute_resolution = 'upheld', dispute_resolved_at = NOW()
         WHERE id = $1`,
        [orderId]
      )
    }
  })
}
