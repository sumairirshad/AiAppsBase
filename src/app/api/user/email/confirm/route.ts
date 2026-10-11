import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { query } from '@/lib/db'

/** Finalizes an email change. Unauthenticated by design — the token in the
 * link is itself the credential, same as the password-reset confirm flow. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token } = body as { token?: string }
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')

  const userRes = await query(
    `SELECT id, pending_email FROM users
     WHERE email_change_token_hash = $1 AND email_change_expires_at > NOW()`,
    [tokenHash]
  )
  if ((userRes?.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'This confirmation link is invalid or has expired.' }, { status: 400 })
  }

  const { id: userId, pending_email: newEmail } = userRes.rows[0]

  // Someone else may have claimed this address while the link sat unused.
  const taken = await query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [newEmail, userId])
  if ((taken.rowCount ?? 0) > 0) {
    await query(
      `UPDATE users SET pending_email = NULL, email_change_token_hash = NULL, email_change_expires_at = NULL WHERE id = $1`,
      [userId]
    )
    return NextResponse.json({ error: 'That email address was claimed by another account in the meantime.' }, { status: 409 })
  }

  // The sign-in identity just changed under every existing session — bump
  // session_version to sign them all out, same as a password reset.
  await query(
    `UPDATE users SET email = pending_email, pending_email = NULL,
       email_change_token_hash = NULL, email_change_expires_at = NULL,
       session_version = session_version + 1
     WHERE id = $1`,
    [userId]
  )

  return NextResponse.json({ ok: true, email: newEmail })
}
