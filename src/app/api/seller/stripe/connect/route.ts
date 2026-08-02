import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query('SELECT role, email, stripe_account_id FROM users WHERE id = $1', [userId])
  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userRes.rows[0]
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Only sellers can connect a payout account' }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    let accountId = user.stripe_account_id as string | null

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      })
      accountId = account.id
      await query(
        `UPDATE users SET stripe_account_id = $1, stripe_onboarding_status = 'pending' WHERE id = $2`,
        [accountId, userId]
      )
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/panel/wallet?stripe_refresh=1`,
      return_url: `${appUrl}/panel/wallet?stripe_return=1`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seller/stripe/connect] failed:', message, err)
    return NextResponse.json({ error: `Could not start Stripe onboarding: ${message}` }, { status: 500 })
  }
}
