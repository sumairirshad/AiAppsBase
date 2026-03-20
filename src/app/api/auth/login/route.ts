import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
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

  const userRes = await query('SELECT id, password_hash, is_verified FROM users WHERE email = $1', [
    email.trim().toLowerCase(),
  ])

  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const user = userRes.rows[0]
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (!user.is_verified) {
    return NextResponse.json({ error: 'Please verify your email address before signing in' }, { status: 401 })
  }

  await setSession(user.id)
  const token = Buffer.from(user.id).toString('base64')

  return NextResponse.json({ ok: true, token, user: { id: user.id, email: email.trim().toLowerCase() } })
}
