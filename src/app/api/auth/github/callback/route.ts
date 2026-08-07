import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUserId, setSession } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { encryptToken } from '@/lib/token-crypto'
import { query } from '@/lib/db'

function redirectToDashboard(origin: string, role: string) {
  const path = role === 'admin' ? '/admin' : role === 'seller' ? '/panel' : '/buyer'
  return NextResponse.redirect(`${origin}${path}`)
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const storedState = cookies().get('github_oauth_state')?.value
  const intent = cookies().get('github_oauth_intent')?.value === 'login' ? 'login' : 'link'
  const pendingRole = cookies().get('github_oauth_role')?.value === 'seller' ? 'seller' : 'buyer'
  cookies().delete('github_oauth_state')
  cookies().delete('github_oauth_intent')
  cookies().delete('github_oauth_role')

  const loginFailure = (reason: string) => NextResponse.redirect(`${origin}/auth/login?error=${reason}`)
  const linkFailure = (reason: string) => NextResponse.redirect(`${origin}/panel/seller/github?error=${reason}`)

  if (!code || !state || state !== storedState) {
    return intent === 'login' ? loginFailure('invalid_state') : linkFailure('invalid_state')
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
    return intent === 'login' ? loginFailure('github_failed') : linkFailure('token_failed')
  }

  const ghUserRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AIAppsBase-App',
    },
  })
  const ghUser = await ghUserRes.json()
  const githubId = ghUser.id as number | undefined
  const githubUsername = ghUser.login as string | undefined

  if (!githubId || !githubUsername) {
    return intent === 'login' ? loginFailure('github_failed') : linkFailure('user_failed')
  }

  if (intent === 'link') {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.redirect(`${origin}/auth/login`)
    }

    await query(
      'UPDATE users SET github_id = $1, github_username = $2, github_access_token = $3 WHERE id = $4',
      [githubId, githubUsername, encryptToken(accessToken), userId]
    )

    return NextResponse.redirect(`${origin}/panel/seller/github?connected=1`)
  }

  // intent === 'login': sign in the matching account, or create a new one.
  try {
    const existingByGithub = await query('SELECT id, role FROM users WHERE github_id = $1', [githubId])
    if ((existingByGithub.rowCount ?? 0) > 0) {
      const user = existingByGithub.rows[0]
      await setSession(user.id)
      return redirectToDashboard(origin, user.role)
    }

    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AIAppsBase-App',
      },
    })
    const emailsData = await emailsRes.json()
    const emails = Array.isArray(emailsData)
      ? (emailsData as Array<{ email: string; primary: boolean; verified: boolean }>)
      : []
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ?? (ghUser.email as string | undefined)

    if (!primaryEmail) {
      return loginFailure('github_no_email')
    }
    const normalizedEmail = primaryEmail.trim().toLowerCase()

    const existingByEmail = await query('SELECT id, role FROM users WHERE email = $1', [normalizedEmail])
    if ((existingByEmail.rowCount ?? 0) > 0) {
      const user = existingByEmail.rows[0]
      await query('UPDATE users SET github_id = $1, github_username = $2 WHERE id = $3', [
        githubId,
        githubUsername,
        user.id,
      ])
      await setSession(user.id)
      return redirectToDashboard(origin, user.role)
    }

    const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'))
    const fullName = (ghUser.name as string | undefined)?.trim() || githubUsername

    try {
      const sellerStatus = pendingRole === 'seller' ? 'pending' : 'approved'
      const inserted = await query(
        `INSERT INTO users (full_name, email, password_hash, role, is_verified, github_id, github_username, seller_status)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)
         RETURNING id, role`,
        [fullName, normalizedEmail, passwordHash, pendingRole, githubId, githubUsername, sellerStatus]
      )
      const newUser = inserted.rows[0]
      await setSession(newUser.id)
      return redirectToDashboard(origin, newUser.role)
    } catch (insertErr: any) {
      // Another request may have just created/linked this same account (double-click, two tabs).
      if (insertErr?.code === '23505') {
        const retry = await query('SELECT id, role FROM users WHERE github_id = $1 OR email = $2', [
          githubId,
          normalizedEmail,
        ])
        if ((retry.rowCount ?? 0) > 0) {
          const user = retry.rows[0]
          await query('UPDATE users SET github_id = $1, github_username = $2 WHERE id = $3', [
            githubId,
            githubUsername,
            user.id,
          ])
          await setSession(user.id)
          return redirectToDashboard(origin, user.role)
        }
      }
      throw insertErr
    }
  } catch (err) {
    console.error('[auth/github/callback] login failed:', err)
    return loginFailure('github_failed')
  }
}
