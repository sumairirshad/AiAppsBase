import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { computeWithdrawalSplit } from '@/lib/payouts'

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query(
    'SELECT stripe_account_id, stripe_payouts_enabled FROM users WHERE id = $1',
    [userId]
  )
  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userRes.rows[0]
  if (!user.stripe_account_id || !user.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: 'Connect your Stripe account before withdrawing' },
      { status: 400 }
    )
  }

  let amount: number
  try {
    const body = await req.json()
    amount = Number(body.amount)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 })
  }
  if (amount < 1) {
    return NextResponse.json({ error: 'Minimum withdrawal is $1' }, { status: 400 })
  }

  const balanceRes = await query(
    `SELECT
       COALESCE((SELECT SUM(o.amount) FROM orders o JOIN products p ON o.product_id=p.id
                 WHERE p.seller_id=$1 AND o.status='completed'),0)::float AS revenue,
       COALESCE((SELECT SUM(requested_amount) FROM withdrawal_requests
                 WHERE seller_id=$1 AND status IN ('pending','approved','failed')),0)::float AS withdrawn_or_pending`,
    [userId]
  )
  const { revenue, withdrawn_or_pending } = balanceRes.rows[0]
  const available = Math.max(0, revenue - withdrawn_or_pending)

  if (amount > available) {
    return NextResponse.json({ error: 'That amount is more than your available balance' }, { status: 400 })
  }

  const { feeAmount, netAmount } = computeWithdrawalSplit(amount)

  try {
    const res = await query(
      `INSERT INTO withdrawal_requests (seller_id, requested_amount, fee_amount, net_amount)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, amount, feeAmount, netAmount]
    )
    return NextResponse.json({ ok: true, id: res.rows[0].id })
  } catch {
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
  }
}
