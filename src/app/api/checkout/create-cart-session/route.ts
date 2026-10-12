import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'
import { computeLicensePrice } from '@/lib/license-pricing'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'checkout:create-cart-session', 10, 60)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cartRes = await query(
    `SELECT c.product_id, c.license_type, p.title, p.price::float AS price, p.seller_id, p.status,
            EXISTS (SELECT 1 FROM orders o WHERE o.product_id = p.id AND o.buyer_id = $1) AS owned
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = $1`,
    [userId]
  )

  // Free items are claimed instantly elsewhere (POST /api/orders), and a
  // product the buyer already owns, or lists themselves, has no business in
  // a paid checkout — only what's left after filtering those out goes to Stripe.
  const payable = cartRes.rows.filter(
    (r: any) => r.status === 'approved' && !r.owned && r.seller_id !== userId && Number(r.price) > 0
  )

  if (payable.length === 0) {
    return NextResponse.json({ error: 'Your cart has nothing that needs checkout right now.' }, { status: 400 })
  }

  const lineItems = payable.map((r: any) => {
    const amount = computeLicensePrice(Number(r.price), r.license_type)
    return { productId: r.product_id, licenseType: r.license_type, title: r.title, amount, unitAmount: Math.round(amount * 100) }
  })

  const tooCheap = lineItems.find((i) => i.unitAmount < 50)
  if (tooCheap) {
    return NextResponse.json(
      { error: `"${tooCheap.title}"'s price is below the minimum Stripe can charge ($0.50).` },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.title, description: `License: ${item.licenseType}` },
          unit_amount: item.unitAmount,
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      metadata: { userId, cart: 'true' },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    // One checkout_sessions row per product in the session — see the comment
    // on completeCheckoutSession in src/lib/orders.ts for why.
    for (const item of lineItems) {
      await query(
        `INSERT INTO checkout_sessions (stripe_session_id, user_id, product_id, license_type, amount, expires_at)
         VALUES ($1, $2, $3, $4, $5, to_timestamp($6))`,
        [session.id, userId, item.productId, item.licenseType, item.amount, session.expires_at]
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout/create-cart-session] failed:', message, err)
    return NextResponse.json(
      { error: `Checkout could not be started: ${message}` },
      { status: 500 }
    )
  }
}
