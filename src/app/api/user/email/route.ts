import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { verifyPassword } from '@/lib/auth'
import { sendEmailChangeConfirmationEmail, EmailSendError } from '@/lib/email'

const EMAIL_CHANGE_TOKEN_TTL_MINUTES = 60
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Starts an email change: sends a confirmation link to the new address. The
 * current email keeps working — and keeps signing the user in — until that
 * link is clicked, since email doubles as the sign-in identity here. */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const newEmail = typeof body.newEmail === 'string' ? body.newEmail.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Enter your current password to confirm this change.' }, { status: 400 })
  }

  try {
    const userRes = await query(`SELECT email, password_hash FROM users WHERE id = $1`, [userId])
    if (userRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ok = await verifyPassword(password, userRes.rows[0].password_hash)
    if (!ok) return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 })

    if (newEmail === userRes.rows[0].email) {
      return NextResponse.json({ error: 'That is already your current email address.' }, { status: 400 })
    }

    const taken = await query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [newEmail, userId])
    if ((taken.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 })
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    await query(
      `UPDATE users SET pending_email = $1, email_change_token_hash = $2,
         email_change_expires_at = NOW() + $3 * INTERVAL '1 minute'
       WHERE id = $4`,
      [newEmail, tokenHash, EMAIL_CHANGE_TOKEN_TTL_MINUTES, userId]
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const confirmUrl = `${appUrl}/auth/confirm-email?token=${rawToken}`

    try {
      await sendEmailChangeConfirmationEmail(newEmail, confirmUrl)
    } catch (error) {
      console.error('[user/email] Failed to send confirmation email', userId, error instanceof EmailSendError ? error.message : error)
      return NextResponse.json({ error: 'Could not send the confirmation email. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, pendingEmail: newEmail })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/** Cancels a pending email change before the confirmation link is used. */
export async function DELETE() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await query(
    `UPDATE users SET pending_email = NULL, email_change_token_hash = NULL, email_change_expires_at = NULL WHERE id = $1`,
    [userId]
  )
  return NextResponse.json({ ok: true })
}
