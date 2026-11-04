import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { query } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { handleConnectPayoutFailed, handleConnectPayoutPaid } from '@/lib/connect-payouts'

/**
 * Separate from /api/webhooks/stripe: Stripe delivers events scoped to a
 * CONNECTED account (payout.paid, payout.failed, ...) through a distinct
 * "Connect" webhook endpoint in the dashboard, signed with its own secret
 * (STRIPE_CONNECT_WEBHOOK_SECRET). This is what closes the loop on "was a
 * withdrawal actually paid into the seller's bank account" — see
 * lib/connect-payouts.ts for why that can't be answered from the platform-
 * account transfer alone.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhooks/stripe-connect] STRIPE_CONNECT_WEBHOOK_SECRET is not set; refusing unverified webhook')
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
    console.error('[webhooks/stripe-connect] signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Shared idempotency table with the platform webhook — Stripe event ids
  // are globally unique, and Stripe explicitly documents that any event may
  // be delivered more than once.
  const alreadyProcessed = await query(
    `INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING event_id`,
    [event.id, event.type]
  )
  if ((alreadyProcessed.rowCount ?? 0) === 0) {
    return NextResponse.json({ received: true, deduped: true })
  }

  const connectedAccountId = event.account
  if (!connectedAccountId) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout
        await handleConnectPayoutPaid(payout.id, connectedAccountId)
        break
      }
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        await handleConnectPayoutFailed(payout.id, connectedAccountId, payout.failure_message ?? null)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[webhooks/stripe-connect] handler failed for event', event.type, err)
    await query('DELETE FROM stripe_webhook_events WHERE event_id = $1', [event.id]).catch(() => {})
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
