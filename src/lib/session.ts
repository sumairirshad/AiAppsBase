import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { encodeSessionValue, decodeSessionValue } from '@/lib/session-token'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: '/',
}

export async function setSession(userId: string) {
  const res = await query<{ session_version: number }>(
    'SELECT session_version FROM users WHERE id = $1',
    [userId]
  )
  const sessionVersion = res.rows[0]?.session_version ?? 0
  cookies().set('session_user_id', encodeSessionValue(userId, sessionVersion), COOKIE_OPTS)
}

export async function getSessionUserId() {
  const decoded = decodeSessionValue(cookies().get('session_user_id')?.value)
  if (!decoded) return undefined

  const res = await query<{ session_version: number }>(
    'SELECT session_version FROM users WHERE id = $1',
    [decoded.userId]
  )
  if ((res.rowCount ?? 0) === 0) return undefined
  if (Number(res.rows[0].session_version) !== decoded.sessionVersion) return undefined

  return decoded.userId
}

export async function clearSession() {
  cookies().delete('session_user_id')
}

/** Invalidates every existing session for this user (e.g. on password change) by bumping their session_version. */
export async function invalidateSessions(userId: string) {
  await query('UPDATE users SET session_version = session_version + 1 WHERE id = $1', [userId])
}
