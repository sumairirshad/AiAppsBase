import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

type ApproveResult =
  | { kind: 'not_found' }
  | { kind: 'already_processed'; status: string }
  | { kind: 'rejected' }
  | { kind: 'not_payout_capable' }
  | { kind: 'approved'; transferId: string }
  | { kind: 'transfer_failed'; message: string }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminRes = await query('SELECT role FROM users WHERE id = $1', [userId])
  if ((adminRes.rowCount ?? 0) === 0 || adminRes.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let action: string
  let reason: string | undefined
  try {
    const body = await req.json()
    action = body.action
    reason = body.reason
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  // The whole read-check-write sequence (including the Stripe transfer call
  // for approvals) runs under a row lock on this withdrawal request, so two
  // concurrent approve/reject calls on the same request can never both pass
  // the pending/failed check and double-transfer or double-reject it.
  const result = await withTransaction<ApproveResult>(async (client) => {
    const wRes = await client.query(
      `SELECT w.id, w.seller_id, w.net_amount, w.status, u.stripe_account_id
       FROM withdrawal_requests w JOIN users u ON w.seller_id = u.id
       WHERE w.id = $1 FOR UPDATE OF w`,
      [params.id]
    )
    if ((wRes.rowCount ?? 0) === 0) return { kind: 'not_found' }
    const withdrawal = wRes.rows[0]

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'failed') {
      return { kind: 'already_processed', status: withdrawal.status }
    }

    if (action === 'reject') {
      await client.query(
        `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [reason || null, userId, params.id]
      )
      return { kind: 'rejected' }
    }

    // Approve: re-verify the seller's Stripe account live before moving money.
    try {
      const account = await stripe.accounts.retrieve(withdrawal.stripe_account_id)
      if (!account.payouts_enabled) {
        return { kind: 'not_payout_capable' }
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(withdrawal.net_amount) * 100),
        currency: 'usd',
        destination: withdrawal.stripe_account_id,
        transfer_group: withdrawal.id,
      })

      await client.query(
        `UPDATE withdrawal_requests SET status = 'approved', stripe_transfer_id = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [transfer.id, userId, params.id]
      )
      return { kind: 'approved', transferId: transfer.id }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[admin/settlements] transfer failed:', message, err)
      await client.query(
        `UPDATE withdrawal_requests SET status = 'failed', rejection_reason = $1, processed_by = $2, processed_at = NOW()
         WHERE id = $3`,
        [message, userId, params.id]
      )
      return { kind: 'transfer_failed', message }
    }
  })

  switch (result.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    case 'already_processed':
      return NextResponse.json({ error: 'This request has already been processed' }, { status: 409 })
    case 'rejected':
      return NextResponse.json({ ok: true, status: 'rejected' })
    case 'not_payout_capable':
      return NextResponse.json(
        { error: "Seller's Stripe account is not payout-capable yet — ask them to finish onboarding" },
        { status: 400 }
      )
    case 'approved':
      return NextResponse.json({ ok: true, status: 'approved', transferId: result.transferId })
    case 'transfer_failed':
      return NextResponse.json({ error: `Transfer failed: ${result.message}` }, { status: 502 })
  }
}
