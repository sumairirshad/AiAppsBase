import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'
import { completeCheckoutSession, expireCheckoutSession } from '@/lib/orders'

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = params

  // Only the session owner can verify. A session covers one or more
  // products — a cart-wide checkout puts every cart item in the same
  // session, one row per product — so this can return several rows.
  const res = await query(
    `SELECT cs.stripe_session_id, cs.status, cs.product_id, cs.license_type,
            cs.amount, cs.completed_at,
            p.title AS product_title
     FROM checkout_sessions cs
     JOIN products p ON cs.product_id = p.id
     WHERE cs.stripe_session_id = $1 AND cs.user_id = $2`,
    [sessionId, userId]
  )

  if ((res.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let { rows } = res
  let status: string = rows[0].status

  // If still pending, ask Stripe directly and finalize the order here — this
  // is the only fulfillment path (no webhook), so it's what the buyer's own
  // redirect back to /checkout/success relies on to mark the order complete.
  if (status === 'pending') {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (stripeSession.payment_status === 'paid') {
      const paymentIntentId =
        typeof stripeSession.payment_intent === 'string'
          ? stripeSession.payment_intent
          : stripeSession.payment_intent?.id ?? null
      await completeCheckoutSession(sessionId, paymentIntentId)
      status = 'completed'
      rows = rows.map((r) => ({ ...r, status: 'completed' }))
    } else if (stripeSession.status === 'expired') {
      await expireCheckoutSession(sessionId)
      status = 'expired'
      rows = rows.map((r) => ({ ...r, status: 'expired' }))
    }
  }

  return NextResponse.json({
    status,
    items: rows.map((row) => ({
      productId: row.product_id,
      productTitle: row.product_title,
      amount: Number(row.amount),
      licenseType: row.license_type,
    })),
    totalAmount: rows.reduce((sum, row) => sum + Number(row.amount), 0),
    completedAt: rows[0].completed_at,
  })
}
