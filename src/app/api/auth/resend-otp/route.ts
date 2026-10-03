import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { issueVerificationOtp } from '@/lib/otp'

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

  const result = await issueVerificationOtp(user, email.trim().toLowerCase())
  if (!result.ok) {
    const status = result.reason === 'email_failed' ? 502 : 429
    return NextResponse.json({ error: result.message }, { status })
  }

  return NextResponse.json({ ok: true })
}
