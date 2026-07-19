import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

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

  const wRes = await query(
    `SELECT w.id, w.seller_id, w.net_amount, w.status, u.stripe_account_id
     FROM withdrawal_requests w JOIN users u ON w.seller_id = u.id
     WHERE w.id = $1`,
    [params.id]
  )
  if ((wRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
  }
  const withdrawal = wRes.rows[0]

  if (withdrawal.status !== 'pending' && withdrawal.status !== 'failed') {
    return NextResponse.json({ error: 'This request has already been processed' }, { status: 409 })
  }

  if (action === 'reject') {
    await query(
      `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = NOW()
       WHERE id = $3`,
      [reason || null, userId, params.id]
    )
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // Approve: re-verify the seller's Stripe account live before moving money.
  try {
    const account = await stripe.accounts.retrieve(withdrawal.stripe_account_id)
    if (!account.payouts_enabled) {
      return NextResponse.json(
        { error: "Seller's Stripe account is not payout-capable yet — ask them to finish onboarding" },
        { status: 400 }
      )
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(withdrawal.net_amount) * 100),
      currency: 'usd',
      destination: withdrawal.stripe_account_id,
      transfer_group: withdrawal.id,
    })

    await query(
      `UPDATE withdrawal_requests SET status = 'approved', stripe_transfer_id = $1, processed_by = $2, processed_at = NOW()
       WHERE id = $3`,
      [transfer.id, userId, params.id]
    )
    return NextResponse.json({ ok: true, status: 'approved', transferId: transfer.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[admin/settlements] transfer failed:', message, err)
    await query(
      `UPDATE withdrawal_requests SET status = 'failed', rejection_reason = $1, processed_by = $2, processed_at = NOW()
       WHERE id = $3`,
      [message, userId, params.id]
    )
    return NextResponse.json({ error: `Transfer failed: ${message}` }, { status: 502 })
  }
}
