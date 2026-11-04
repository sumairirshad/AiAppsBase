import { query } from '@/lib/db'
import { stripe } from '@/lib/stripe'

/**
 * Confirms that money previously transferred to a seller's Stripe Connect
 * balance (approving a withdrawal — see lib/settlements.ts) has actually
 * been paid out to their bank, or that the payout failed.
 *
 * A Stripe `transfer` only moves funds into the connected account's own
 * Stripe balance; the connected account's OWN payout schedule then pays out
 * its ENTIRE available balance in one batch, not one bank payout per
 * transfer. So a `payout.paid`/`payout.failed` event can't be matched to a
 * withdrawal_request by id alone — it has to be reconciled by listing the
 * payout's balance transactions (on the connected account) and matching
 * each `source` transfer id against `withdrawal_requests.stripe_transfer_id`.
 *
 * These are invoked from a dedicated Connect webhook endpoint (see
 * /api/webhooks/stripe-connect) — Stripe delivers `account.*`-scoped events
 * like `payout.paid` separately from platform-account events, signed with a
 * different (Connect) webhook secret.
 */

async function transferIdsInPayout(payoutId: string, connectedAccountId: string): Promise<string[]> {
  const ids: string[] = []
  for await (const txn of stripe.balanceTransactions.list(
    { payout: payoutId, type: 'transfer', limit: 100 },
    { stripeAccount: connectedAccountId }
  )) {
    // Belt-and-suspenders: don't rely solely on the `type` filter sent to
    // Stripe's API actually being honored — only a genuine transfer-sourced
    // balance transaction should ever mark a withdrawal paid/failed.
    if (txn.type !== 'transfer') continue
    const source = txn.source
    const sourceId = typeof source === 'string' ? source : source?.id
    if (sourceId) ids.push(sourceId)
  }
  return ids
}

export async function handleConnectPayoutPaid(payoutId: string, connectedAccountId: string): Promise<void> {
  const transferIds = await transferIdsInPayout(payoutId, connectedAccountId)
  if (transferIds.length === 0) return

  await query(
    `UPDATE withdrawal_requests
     SET status = 'paid', stripe_payout_id = $1, payout_confirmed_at = NOW()
     WHERE stripe_transfer_id = ANY($2) AND status = 'approved'`,
    [payoutId, transferIds]
  )
}

export async function handleConnectPayoutFailed(
  payoutId: string,
  connectedAccountId: string,
  failureMessage: string | null
): Promise<void> {
  const transferIds = await transferIdsInPayout(payoutId, connectedAccountId)
  if (transferIds.length === 0) return

  await query(
    `UPDATE withdrawal_requests
     SET status = 'payout_failed', stripe_payout_id = $1, payout_failure_reason = $2, payout_confirmed_at = NOW()
     WHERE stripe_transfer_id = ANY($3) AND status = 'approved'`,
    [payoutId, failureMessage, transferIds]
  )
}
