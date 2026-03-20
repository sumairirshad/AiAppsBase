import { cookies } from 'next/headers'

export async function setSession(userId: string) {
  cookies().set('session_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
}

export async function getSessionUserId() {
  return cookies().get('session_user_id')?.value
}

export async function clearSession() {
  cookies().delete('session_user_id')
}
