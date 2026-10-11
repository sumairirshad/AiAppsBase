import { query } from '@/lib/db'
import { sendOrderReceiptEmail } from '@/lib/email'
import { getPlatformFeePercent } from '@/lib/payouts'

/**
 * Idempotently finalizes a paid checkout session: creates an order for each
 * product in it (if one doesn't already exist for this buyer/product),
 * clears the matching cart items, and marks each row completed. A session
 * covers one or more products — a cart-wide checkout puts every cart item in
 * the same Stripe session, one checkout_sessions row per product — so every
 * row for this session is fulfilled, not just the first. Safe to call more
 * than once for the same session (e.g. the buyer reloading /checkout/success).
 */
export async function completeCheckoutSession(
  stripeSessionId: string,
  paymentIntentId?: string | null
): Promise<void> {
  const res = await query(
    `SELECT user_id, product_id, license_type, amount, status
     FROM checkout_sessions WHERE stripe_session_id = $1`,
    [stripeSessionId]
  )
  if ((res.rowCount ?? 0) === 0) return

  const feePercent = await getPlatformFeePercent()

  for (const row of res.rows) {
    if (row.status === 'completed') continue

    const inserted = await query<{ id: string }>(
      `INSERT INTO orders (product_id, buyer_id, amount, license_type, stripe_payment_intent_id, commission_rate_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (product_id, buyer_id) DO NOTHING
       RETURNING id`,
      [row.product_id, row.user_id, Number(row.amount), row.license_type, paymentIntentId ?? null, feePercent]
    )

    await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [row.user_id, row.product_id])

    await query(
      `UPDATE checkout_sessions SET status = 'completed', completed_at = NOW()
       WHERE stripe_session_id = $1 AND product_id = $2`,
      [stripeSessionId, row.product_id]
    )

    // Only send a receipt the first time this order is actually created —
    // completeCheckoutSession can be called again for the same session (e.g.
    // the webhook and the client's own verify-on-return both firing).
    if ((inserted.rowCount ?? 0) > 0) {
      await sendReceiptBestEffort(inserted.rows[0].id, row.user_id, row.product_id, Number(row.amount), row.license_type)
    }
  }
}

async function sendReceiptBestEffort(
  orderId: string,
  buyerId: string,
  productId: string,
  amount: number,
  licenseType: string
): Promise<void> {
  try {
    const buyerRes = await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [buyerId])
    const productRes = await query<{ title: string }>('SELECT title FROM products WHERE id = $1', [productId])
    const buyerEmail = buyerRes.rows[0]?.email
    const productTitle = productRes.rows[0]?.title
    if (!buyerEmail || !productTitle) return

    await sendOrderReceiptEmail(buyerEmail, { orderId, productTitle, amount, licenseType })
  } catch (error) {
    console.error('[orders] Failed to send order receipt email', orderId, error)
  }
}

/** Marks a checkout session expired — only if it's still pending, so this can never clobber a session that already completed. */
export async function expireCheckoutSession(stripeSessionId: string): Promise<void> {
  await query(
    `UPDATE checkout_sessions SET status = 'expired' WHERE stripe_session_id = $1 AND status = 'pending'`,
    [stripeSessionId]
  )
}
