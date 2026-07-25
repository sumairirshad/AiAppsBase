import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUserId } from '@/lib/session'

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth is not configured on this server.' }, { status: 500 })
  }

  // Signed-in visitors are connecting GitHub for repo access (seller flow).
  // Signed-out visitors are signing in or signing up with GitHub.
  const userId = await getSessionUserId()
  const intent = userId ? 'link' : 'login'

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') === 'seller' ? 'seller' : 'buyer'

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  }

  cookies().set('github_oauth_state', state, cookieOpts)
  cookies().set('github_oauth_intent', intent, cookieOpts)
  if (intent === 'login') {
    cookies().set('github_oauth_role', role, cookieOpts)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: intent === 'link' ? 'read:user,public_repo' : 'read:user user:email',
    state,
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
