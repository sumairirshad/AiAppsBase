import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MINUTES } from '@/lib/auth'
import { setSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password } = body as { email?: string; password?: string }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const userRes = await query(
    'SELECT id, password_hash, is_verified, role, login_failed_attempts, login_locked_until FROM users WHERE email = $1',
    [email.trim().toLowerCase()]
  )

  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const user = userRes.rows[0]

  if (user.login_locked_until && new Date(user.login_locked_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again in a few minutes.' },
      { status: 429 }
    )
  }

  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    const attempts = user.login_failed_attempts + 1
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      await query(
        `UPDATE users SET login_failed_attempts = 0, login_locked_until = NOW() + $2 * INTERVAL '1 minute' WHERE id = $1`,
        [user.id, LOGIN_LOCKOUT_MINUTES]
      )
    } else {
      await query('UPDATE users SET login_failed_attempts = $2 WHERE id = $1', [user.id, attempts])
    }
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (!user.is_verified) {
    return NextResponse.json({ error: 'Please verify your email address before signing in' }, { status: 401 })
  }

  if (user.login_failed_attempts > 0 || user.login_locked_until) {
    await query('UPDATE users SET login_failed_attempts = 0, login_locked_until = NULL WHERE id = $1', [user.id])
  }

  await setSession(user.id)

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: email.trim().toLowerCase(), role: user.role },
  })
}
