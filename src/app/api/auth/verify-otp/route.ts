import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, code } = body as { email?: string; code?: string }
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
  }

  const userRes = await query('SELECT id, is_verified FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ])
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'No account found for this email' }, { status: 404 })
  }

  const user = userRes.rows[0]
  if (user.is_verified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
  }

  const otpRes = await query(
    `SELECT id, expires_at, used FROM otps WHERE user_id = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1`,
    [user.id, code.trim()]
  )

  if ((otpRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const otp = otpRes.rows[0]
  if (otp.used) {
    return NextResponse.json({ error: 'This code has already been used' }, { status: 400 })
  }

  const expiresAt = new Date(otp.expires_at)
  if (expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 })
  }

  await query('UPDATE otps SET used = TRUE WHERE id = $1', [otp.id])
  await query('UPDATE users SET is_verified = TRUE WHERE id = $1', [user.id])

  return NextResponse.json({ ok: true })
}
