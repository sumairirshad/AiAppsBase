import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query('SELECT stripe_account_id FROM users WHERE id = $1', [userId])
  const accountId = userRes.rows[0]?.stripe_account_id as string | null

  if (!accountId) {
    return NextResponse.json({ connected: false, onboardingStatus: 'not_started', chargesEnabled: false, payoutsEnabled: false })
  }

  try {
    const account = await stripe.accounts.retrieve(accountId)
    const onboardingStatus = account.details_submitted ? 'complete' : 'pending'

    await query(
      `UPDATE users SET
        stripe_onboarding_status = $1, stripe_charges_enabled = $2, stripe_payouts_enabled = $3
       WHERE id = $4`,
      [onboardingStatus, Boolean(account.charges_enabled), Boolean(account.payouts_enabled), userId]
    )

    return NextResponse.json({
      connected: true,
      onboardingStatus,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seller/stripe/status] failed:', message, err)
    return NextResponse.json({ error: `Could not check Stripe status: ${message}` }, { status: 500 })
  }
}
