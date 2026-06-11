import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUserId } from '@/lib/session'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const storedState = cookies().get('github_oauth_state')?.value
  cookies().delete('github_oauth_state')

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${origin}/panel/seller/github?error=invalid_state`)
  }

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.redirect(`${origin}/auth/register`)
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token as string | undefined

  if (!accessToken) {
    return NextResponse.redirect(`${origin}/panel/seller/github?error=token_failed`)
  }

  const ghUserRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AIForge-App',
    },
  })

  const ghUser = await ghUserRes.json()
  const githubUsername = ghUser.login as string | undefined

  if (!githubUsername) {
    return NextResponse.redirect(`${origin}/panel/seller/github?error=user_failed`)
  }

  await query(
    'UPDATE users SET github_username = $1, github_access_token = $2 WHERE id = $3',
    [githubUsername, accessToken, userId]
  )

  return NextResponse.redirect(`${origin}/panel/seller/github?connected=1`)
}
