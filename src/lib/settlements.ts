import { withTransaction } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export type SettlementActionResult =
  | { kind: 'not_found' }
  | { kind: 'already_processed'; status: string; sellerId: string }
  | { kind: 'rejected'; sellerId: string; netAmount: number }
  | { kind: 'not_payout_capable'; sellerId: string }
  | { kind: 'approved'; transferId: string; sellerId: string; netAmount: number }
  | { kind: 'transfer_failed'; message: string; sellerId: string; netAmount: number }

/**
 * Approves or rejects a withdrawal request. The whole read-check-write
 * sequence (including the Stripe transfer call for approvals) runs under a
 * row lock on the withdrawal request, so two concurrent approve/reject
 * calls on the same request can never both pass the pending/failed check
 * and double-transfer or double-reject it.
 */
export async function processWithdrawalAction(
  withdrawalId: string,
  action: 'approve' | 'reject',
  adminUserId: string,
  reason: string | undefined
): Promise<SettlementActionResult> {
  return withTransaction<SettlementActionResult>(async (client) => {
    const wRes = await client.query(
      `SELECT w.id, w.seller_id, w.net_amount, w.status, u.stripe_account_id
       FROM withdrawal_requests w JOIN users u ON w.seller_id = u.id
       WHERE w.id = $1 FOR UPDATE OF w`,
      [withdrawalId]
    )
    if ((wRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    const withdrawal = wRes.rows[0]
    const netAmount = Number(withdrawal.net_amount)

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'failed') {
      return { kind: 'already_processed', status: withdrawal.status, sellerId: withdrawal.seller_id }
    }

    if (action === 'reject') {
      await client.query(
        `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [reason || null, adminUserId, withdrawalId]
      )
      return { kind: 'rejected', sellerId: withdrawal.seller_id, netAmount }
    }

    // Approve: re-verify the seller's Stripe account live before moving money.
    try {
      const account = await stripe.accounts.retrieve(withdrawal.stripe_account_id)
      if (!account.payouts_enabled) {
        return { kind: 'not_payout_capable', sellerId: withdrawal.seller_id }
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(netAmount * 100),
        currency: 'usd',
        destination: withdrawal.stripe_account_id,
        transfer_group: withdrawal.id,
      })

      await client.query(
        `UPDATE withdrawal_requests SET status = 'approved', stripe_transfer_id = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [transfer.id, adminUserId, withdrawalId]
      )
      return { kind: 'approved', transferId: transfer.id, sellerId: withdrawal.seller_id, netAmount }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[settlements] transfer failed:', message, err)
      await client.query(
        `UPDATE withdrawal_requests SET status = 'failed', rejection_reason = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [message, adminUserId, withdrawalId]
      )
      return { kind: 'transfer_failed', message, sellerId: withdrawal.seller_id, netAmount }
    }
  })
}
