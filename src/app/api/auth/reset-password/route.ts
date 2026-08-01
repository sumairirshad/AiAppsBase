import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { query } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, password } = body as { token?: string; password?: string }
  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
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

  await query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL,
         login_failed_attempts = 0,
         login_locked_until = NULL
     WHERE id = $2`,
    [passwordHash, userId]
  )

  return NextResponse.json({ ok: true })
}
