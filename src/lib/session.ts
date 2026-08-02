import { cookies } from 'next/headers'
import { encodeSessionValue, decodeSessionValue } from '@/lib/session-token'

export async function setSession(userId: string) {
  cookies().set('session_user_id', encodeSessionValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
}

export async function getSessionUserId() {
  return decodeSessionValue(cookies().get('session_user_id')?.value)
}

export async function clearSession() {
  cookies().delete('session_user_id')
}
