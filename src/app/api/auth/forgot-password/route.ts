import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { query } from '@/lib/db'
import { sendPasswordResetEmail, EmailSendError } from '@/lib/email'

const RESET_TOKEN_TTL_MINUTES = 60

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email } = body as { email?: string }
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const userRes = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()])

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if ((userRes?.rowCount ?? 0) > 0) {
    const userId = userRes.rows[0].id
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    await query(
      `UPDATE users
       SET password_reset_token_hash = $1, password_reset_expires_at = NOW() + $2 * INTERVAL '1 minute'
       WHERE id = $3`,
      [tokenHash, RESET_TOKEN_TTL_MINUTES, userId]
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`

    try {
      await sendPasswordResetEmail(email.trim().toLowerCase(), resetUrl)
    } catch (error) {
      // Don't leak delivery failures to the client either — log for ops, but
      // keep the response identical to the "account not found" case.
      console.error(`[forgot-password] Failed to send reset email to ${email}`, error instanceof EmailSendError ? error.message : error)
    }
  }

  return NextResponse.json({ ok: true })
}
