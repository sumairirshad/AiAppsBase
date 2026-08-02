import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { setSession } from '@/lib/session'
import { OTP_MAX_ATTEMPTS, OTP_LOCKOUT_MINUTES } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, code } = body as { email?: string; code?: string }
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
  }

  const userRes = await query(
    'SELECT id, is_verified, otp_failed_attempts, otp_locked_until FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  )
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'No account found for this email' }, { status: 404 })
  }

  const user = userRes.rows[0]
  if (user.is_verified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
  }

  if (user.otp_locked_until && new Date(user.otp_locked_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please request a new code in a few minutes.' },
      { status: 429 }
    )
  }

  const otpRes = await query(
    `SELECT id, expires_at, used FROM otps WHERE user_id = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1`,
    [user.id, code.trim()]
  )

  const recordFailure = async () => {
    const attempts = user.otp_failed_attempts + 1
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await query(
        `UPDATE users SET otp_failed_attempts = 0, otp_locked_until = NOW() + $2 * INTERVAL '1 minute' WHERE id = $1`,
        [user.id, OTP_LOCKOUT_MINUTES]
      )
    } else {
      await query('UPDATE users SET otp_failed_attempts = $2 WHERE id = $1', [user.id, attempts])
    }
  }

  if ((otpRes?.rowCount ?? 0) === 0) {
    await recordFailure()
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const otp = otpRes.rows[0]
  if (otp.used) {
    await recordFailure()
    return NextResponse.json({ error: 'This code has already been used' }, { status: 400 })
  }

  const expiresAt = new Date(otp.expires_at)
  if (expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 })
  }

  await query('UPDATE otps SET used = TRUE WHERE id = $1', [otp.id])
  await query(
    'UPDATE users SET is_verified = TRUE, otp_failed_attempts = 0, otp_locked_until = NULL WHERE id = $1',
    [user.id]
  )

  await setSession(user.id)

  return NextResponse.json({ ok: true })
}
