import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
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

  // Fetch product
  const productRes = await query(
    `SELECT id, title, price, seller_id FROM products WHERE id = $1 AND status = 'approved'`,
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

  // Prevent duplicate purchase
  const existing = await query(
    `SELECT id FROM orders WHERE product_id = $1 AND buyer_id = $2`,
    [productId, userId]
  )
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: 'You already own this product' }, { status: 409 })
  }

  const amount = Number(product.price)
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

    // Persist session in DB for idempotency & expiry tracking
    await query(
      `INSERT INTO checkout_sessions
         (stripe_session_id, user_id, product_id, license_type, amount, expires_at)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
      [session.id, userId, productId, licenseType, amount, session.expires_at]
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
