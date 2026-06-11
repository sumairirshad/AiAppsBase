import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUserId } from '@/lib/session'

export async function GET(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    const origin = new URL(req.url).origin
    return NextResponse.redirect(`${origin}/auth/register`)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth is not configured on this server.' }, { status: 500 })
  }

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)

  cookies().set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'read:user,public_repo',
    state,
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
