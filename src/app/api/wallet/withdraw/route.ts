import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { computeWithdrawalSplit } from '@/lib/payouts'

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query(
    'SELECT role, stripe_account_id, stripe_payouts_enabled FROM users WHERE id = $1',
    [userId]
  )
  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userRes.rows[0]
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
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

  try {
    const result = await withTransaction(async (client) => {
      // Lock the seller's own row so two concurrent withdrawal requests from
      // the same seller can't both read the same "available balance" before
      // either INSERT lands — without this, both could pass the balance
      // check and together overdraw the seller's actual earnings.
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId])

      const balanceRes = await client.query(
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
        return { ok: false as const, error: 'That amount is more than your available balance' }
      }

      const { feeAmount, netAmount } = await computeWithdrawalSplit(amount)
      const res = await client.query(
        `INSERT INTO withdrawal_requests (seller_id, requested_amount, fee_amount, net_amount)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, amount, feeAmount, netAmount]
      )
      return { ok: true as const, id: res.rows[0].id }
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: result.id })
  } catch {
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
  }
}
