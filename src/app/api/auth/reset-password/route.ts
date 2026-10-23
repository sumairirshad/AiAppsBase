import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { query } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // The reset token itself is high-entropy, but this is still a credential
  // endpoint with no limiter at all today — defense in depth, consistent
  // with every other auth route.
  const limited = await rateLimit(req, 'auth:reset-password', 10, 600)
  if (limited) return limited

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, password } = body as { token?: string; password?: string }
  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }

  const passwordError = validatePasswordStrength(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const userRes = await query(
    `SELECT id FROM users
     WHERE password_reset_token_hash = $1 AND password_reset_expires_at > NOW()`,
    [tokenHash]
  )
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
  }

  const userId = userRes.rows[0].id
  const passwordHash = await hashPassword(password)

  // Bumping session_version invalidates every signed-in session for this
  // user — important here since anyone who reset the password this way may
  // be recovering the account from someone else's unwanted access.
  await query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL,
         login_failed_attempts = 0,
         login_locked_until = NULL,
         session_version = session_version + 1
     WHERE id = $2`,
    [passwordHash, userId]
  )

  return NextResponse.json({ ok: true })
}
