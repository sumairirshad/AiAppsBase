import { query } from '@/lib/db'

/**
 * Idempotently finalizes a paid checkout session: creates the order (if one
 * doesn't already exist for this buyer/product), clears the matching cart
 * item, and marks the checkout session completed. Safe to call more than
 * once for the same session — both the Stripe webhook and the client-side
 * verify-page fallback call this, and either may run first.
 */
export async function completeCheckoutSession(stripeSessionId: string): Promise<void> {
  const res = await query(
    `SELECT user_id, product_id, license_type, amount, status
     FROM checkout_sessions WHERE stripe_session_id = $1`,
    [stripeSessionId]
  )
  if ((res.rowCount ?? 0) === 0) return
  const row = res.rows[0]
  if (row.status === 'completed') return

  await query(
    `INSERT INTO orders (product_id, buyer_id, amount, license_type)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, buyer_id) DO NOTHING`,
    [row.product_id, row.user_id, Number(row.amount), row.license_type]
  )

  await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [row.user_id, row.product_id])

  await query(
    `UPDATE checkout_sessions SET status = 'completed', completed_at = NOW() WHERE stripe_session_id = $1`,
    [stripeSessionId]
  )
}

/** Marks a checkout session expired — only if it's still pending, so a late-arriving "expired" event can't clobber a completed order. */
export async function expireCheckoutSession(stripeSessionId: string): Promise<void> {
  await query(
    `UPDATE checkout_sessions SET status = 'expired' WHERE stripe_session_id = $1 AND status = 'pending'`,
    [stripeSessionId]
  )
}
