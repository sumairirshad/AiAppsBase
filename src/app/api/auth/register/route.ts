import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, generateOtpCode, getOtpExpiry } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { fullName, email, password, role } = body as {
    fullName?: string
    email?: string
    password?: string
    role?: string
  }

  if (!fullName || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['buyer', 'seller'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()])
  if ((existing?.rowCount ?? 0) > 0) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  const insertUser = await query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [fullName.trim(), email.trim().toLowerCase(), passwordHash, role]
  )

  const userId = insertUser.rows[0]?.id
  if (!userId) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const otp = generateOtpCode()
  const expiresAt = getOtpExpiry(10)

  await query(
    'INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, otp, expiresAt.toISOString()]
  )

  try {
    await sendOtpEmail(email.trim().toLowerCase(), otp)
  } catch (error) {
    console.error('Failed to send OTP email', error)
  }

  return NextResponse.json({ ok: true })
}
