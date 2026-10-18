import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { query } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { completeCheckoutSession, expireCheckoutSession } from '@/lib/orders'
import { handleStripeDisputeClosed, handleStripeDisputeCreated } from '@/lib/disputes'

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

  // Stripe explicitly documents that any event may be delivered more than
  // once. completeCheckoutSession has its own idempotent DB logic, but the
  // dispute handlers below don't inherently — this makes every event type
  // processed at most once, uniformly, rather than relying on each handler
  // to separately get idempotency right.
  const alreadyProcessed = await query(
    `INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING event_id`,
    [event.id, event.type]
  )
  if ((alreadyProcessed.rowCount ?? 0) === 0) {
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') {
          const paymentIntentId =
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
          await completeCheckoutSession(session.id, paymentIntentId)
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await expireCheckoutSession(session.id)
        break
      }
      // See src/lib/disputes.ts for the documented access policy these follow.
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id ?? null
        await handleStripeDisputeCreated(paymentIntentId, dispute.reason ?? null)
        break
      }
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id ?? null
        if (dispute.status === 'won' || dispute.status === 'lost') {
          await handleStripeDisputeClosed(paymentIntentId, dispute.status)
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[webhooks/stripe] handler failed for event', event.type, err)
    // Let Stripe retry: remove our own "already processed" marker so a
    // transient failure (DB blip, etc.) doesn't permanently swallow the event.
    await query('DELETE FROM stripe_webhook_events WHERE event_id = $1', [event.id]).catch(() => {})
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
