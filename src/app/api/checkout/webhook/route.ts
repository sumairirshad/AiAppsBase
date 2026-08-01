import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { completeCheckoutSession, expireCheckoutSession } from '@/lib/orders'

/**
 * Stripe webhook — the authoritative source of truth for order fulfillment.
 * The client-side /checkout/verify page also calls completeCheckoutSession
 * as a fallback for the common case (user redirected back successfully),
 * but a buyer who pays and closes the tab before that fires would otherwise
 * never get their order without this.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[checkout/webhook] STRIPE_WEBHOOK_SECRET is not set — rejecting webhook.')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout/webhook] signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as { id: string; payment_status?: string }
        if (session.payment_status === 'paid' || event.type === 'checkout.session.async_payment_succeeded') {
          await completeCheckoutSession(session.id)
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as { id: string }
        await expireCheckoutSession(session.id)
        break
      }
      default:
        break
    }
  } catch (err) {
    // Return 500 so Stripe retries — the handlers above are idempotent.
    console.error('[checkout/webhook] handler failed:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
