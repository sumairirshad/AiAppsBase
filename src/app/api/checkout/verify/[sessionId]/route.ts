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

  // Only the session owner can verify
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

  const row = res.rows[0]

  // If still pending, ask Stripe directly and finalize the order here — this
  // is the only fulfillment path (no webhook), so it's what the buyer's own
  // redirect back to /checkout/success relies on to mark the order complete.
  if (row.status === 'pending') {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (stripeSession.payment_status === 'paid') {
      await completeCheckoutSession(sessionId)
      row.status = 'completed'
    } else if (stripeSession.status === 'expired') {
      await expireCheckoutSession(sessionId)
      row.status = 'expired'
    }
  }

  return NextResponse.json({
    status: row.status,
    productId: row.product_id,
    productTitle: row.product_title,
    amount: Number(row.amount),
    licenseType: row.license_type,
    completedAt: row.completed_at,
  })
}
