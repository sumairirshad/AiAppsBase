import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

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

  // If still pending, ask Stripe directly (webhook may not have arrived yet)
  if (row.status === 'pending') {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (stripeSession.payment_status === 'paid') {
      // Ensure order is created (webhook fallback)
      const existingOrder = await query(
        `SELECT id FROM orders WHERE product_id = $1 AND buyer_id = $2`,
        [row.product_id, userId]
      )
      if ((existingOrder.rowCount ?? 0) === 0) {
        await query(
          `INSERT INTO orders (product_id, buyer_id, amount, license_type)
           VALUES ($1, $2, $3, $4)`,
          [row.product_id, userId, Number(row.amount), row.license_type]
        )
      }

      // Remove the purchased item from the buyer's cart if present.
      await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [userId, row.product_id])

      await query(
        `UPDATE checkout_sessions
         SET status = 'completed', completed_at = NOW()
         WHERE stripe_session_id = $1`,
        [sessionId]
      )
      row.status = 'completed'
    } else if (stripeSession.status === 'expired') {
      await query(
        `UPDATE checkout_sessions SET status = 'expired' WHERE stripe_session_id = $1`,
        [sessionId]
      )
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
