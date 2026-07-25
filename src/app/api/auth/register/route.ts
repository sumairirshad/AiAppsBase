import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, generateOtpCode, getOtpExpiry } from '@/lib/auth'
import { sendOtpEmail, EmailSendError } from '@/lib/email'

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
  const sellerStatus = role === 'seller' ? 'pending' : 'approved'
  const insertUser = await query(
    'INSERT INTO users (full_name, email, password_hash, role, seller_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [fullName.trim(), email.trim().toLowerCase(), passwordHash, role, sellerStatus]
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
    console.error(`[register] Failed to send OTP email to ${email}`, error)
    const message =
      error instanceof EmailSendError
        ? error.message
        : 'The verification email could not be sent. Please try resending the code.'
    // The account and OTP were already created above, so we still return 200 -
    // the user can retry delivery from the OTP page. We do NOT report success here;
    // the frontend must only show a success toast when emailSent is true.
    return NextResponse.json({ ok: true, emailSent: false, emailError: message })
  }

  return NextResponse.json({ ok: true, emailSent: true })
}
