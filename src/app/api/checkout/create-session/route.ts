import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'
import { computeLicensePrice, normalizeLicenseType } from '@/lib/license-pricing'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'checkout:create-session', 10, 60)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let productId: string, licenseType: string
  try {
    ;({ productId, licenseType } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!productId || !licenseType) {
    return NextResponse.json({ error: 'productId and licenseType are required' }, { status: 400 })
  }
  if (!normalizeLicenseType(licenseType)) {
    return NextResponse.json({ error: 'Invalid licenseType' }, { status: 400 })
  }

  // Fetch product
  const productRes = await query(
    `SELECT id, title, price, seller_id, current_version_id FROM products WHERE id = $1 AND status = 'approved'`,
    [productId]
  )
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 })
  }

  const product = productRes.rows[0]

  // Seller cannot buy their own product
  if (product.seller_id === userId) {
    return NextResponse.json({ error: 'Cannot purchase your own product' }, { status: 403 })
  }

  // Block only a duplicate purchase of the exact version currently
  // published — a buyer who already owns an older version is allowed to buy
  // again to get a newer one (each purchase binds to its own
  // product_version_id; see completeCheckoutSession in lib/orders.ts).
  //
  // current_version_id can itself be NULL (a product approved before the
  // versioning system existed, still awaiting its first real snapshot) --
  // `product_version_id = NULL` is never true in SQL, so a plain equality
  // check here would silently never block a repeat purchase of such a
  // product. `IS NOT DISTINCT FROM` is NULL-safe equality: it also matches
  // when both sides are NULL.
  const existing = await query(
    `SELECT id FROM orders
     WHERE product_id = $1 AND buyer_id = $2 AND status = 'completed'
       AND product_version_id IS NOT DISTINCT FROM $3`,
    [productId, userId, product.current_version_id ?? null]
  )
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: 'You already own the current version of this product' }, { status: 409 })
  }

  // Charge the price for the selected license tier, not the product's flat
  // base price — the buyer picks personal/commercial/extended client-side,
  // and that choice must be priced server-side or every buyer pays the same
  // amount no matter which tier they select.
  const amount = computeLicensePrice(Number(product.price), licenseType)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Stripe requires a minimum charge of $0.50 USD. Reject cheaper/zero amounts
  // up front with a clear message instead of letting Stripe throw a 500.
  const unitAmount = Math.round(amount * 100)
  if (unitAmount < 50) {
    return NextResponse.json(
      { error: 'This product’s price is below the minimum Stripe can charge ($0.50).' },
      { status: 400 }
    )
  }

  try {
    // Create Stripe checkout session (30 min expiry)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: `License: ${licenseType}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/product/${productId}`,
      metadata: {
        userId,
        productId,
        licenseType,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    // Persist session in DB for idempotency & expiry tracking. The currently
    // published version is snapshotted now, at checkout-creation time, so
    // the order this session eventually produces is bound to the version
    // the buyer actually saw/paid for — even if the seller publishes a
    // newer one while this Stripe session is still open.
    await query(
      `INSERT INTO checkout_sessions
         (stripe_session_id, user_id, product_id, license_type, amount, expires_at, product_version_id)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)`,
      [session.id, userId, productId, licenseType, amount, session.expires_at, product.current_version_id ?? null]
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    // Surface the real reason (Stripe error, DB error, etc.) instead of a bare 500.
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout/create-session] failed:', message, err)
    return NextResponse.json(
      { error: `Checkout could not be started: ${message}` },
      { status: 500 }
    )
  }
}
