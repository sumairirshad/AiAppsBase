import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateOtpCode, getOtpExpiry, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/auth'
import { sendOtpEmail, EmailSendError } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email } = body as { email?: string }
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const userRes = await query(
    'SELECT id, is_verified, otp_locked_until FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  )
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'No account found for this email' }, { status: 404 })
  }

  const user = userRes.rows[0]
  if (user.is_verified) {
    return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
  }

  if (user.otp_locked_until && new Date(user.otp_locked_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please try again in a few minutes.' },
      { status: 429 }
    )
  }

  const lastOtpRes = await query(
    'SELECT created_at FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [user.id]
  )
  if ((lastOtpRes?.rowCount ?? 0) > 0) {
    const secondsSinceLast = (Date.now() - new Date(lastOtpRes.rows[0].created_at).getTime()) / 1000
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.` },
        { status: 429 }
      )
    }
  }

  const otp = generateOtpCode()
  const expiresAt = getOtpExpiry(10)

  await query('INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    otp,
    expiresAt.toISOString(),
  ])

  try {
    await sendOtpEmail(email.trim().toLowerCase(), otp)
  } catch (error) {
    console.error(`[resend-otp] Failed to send OTP email to ${email}`, error)
    const message =
      error instanceof EmailSendError
        ? error.message
        : 'The verification email could not be sent. Please try again shortly.'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
