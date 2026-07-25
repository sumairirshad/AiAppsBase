import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateOtpCode, getOtpExpiry } from '@/lib/auth'
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

  const userRes = await query('SELECT id, is_verified FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ])
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'No account found for this email' }, { status: 404 })
  }

  const user = userRes.rows[0]
  if (user.is_verified) {
    return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
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
