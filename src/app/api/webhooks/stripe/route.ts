import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe'
import { completeCheckoutSession, expireCheckoutSession } from '@/lib/orders'

/**
 * Fulfillment must not depend on the buyer's browser making it back to
 * /checkout/success — a closed tab, a network drop, or a buyer who never
 * returns means Stripe was paid but no order is ever created. This
 * signature-verified webhook is the authoritative fulfillment path;
 * verify()'s own retry/redelivery covers the client-redirect path falling
 * through too (completeCheckoutSession is idempotent either way).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set; refusing unverified webhook')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhooks/stripe] signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') {
          await completeCheckoutSession(session.id)
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await expireCheckoutSession(session.id)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[webhooks/stripe] handler failed for event', event.type, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
