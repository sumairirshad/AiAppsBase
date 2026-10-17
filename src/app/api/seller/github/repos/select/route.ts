import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { decryptToken } from '@/lib/token-crypto'

async function requireSellerWithToken(userId: string) {
  const userRes = await query(
    'SELECT role, github_access_token FROM users WHERE id = $1',
    [userId]
  )
  if ((userRes.rowCount ?? 0) === 0) return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  const { role, github_access_token } = userRes.rows[0]
  if (role !== 'seller' && role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const accessToken = decryptToken(github_access_token)
  if (!accessToken) {
    return { error: NextResponse.json({ error: 'GitHub is not connected' }, { status: 400 }) }
  }
  return { accessToken }
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auth = await requireSellerWithToken(userId)
  if (auth.error) return auth.error
  const { accessToken } = auth

  let fullName: unknown, defaultBranch: unknown
  try {
    ;({ fullName, defaultBranch } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (typeof fullName !== 'string' || !/^[^/\s]+\/[^/\s]+$/.test(fullName)) {
    return NextResponse.json({ error: 'A valid "owner/repo" fullName is required' }, { status: 400 })
  }

  // Re-check against GitHub with the seller's own token rather than trusting
  // the client-submitted repo name outright — this is the same seller token
  // used later to fetch the zipball, so if it can't see the repo now, the
  // seller doesn't actually have usable access to it.
  const repoRes = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AIAppsBase-App',
    },
  })
  if (!repoRes.ok) {
    return NextResponse.json(
      { error: repoRes.status === 404 ? 'Repository not found or not accessible with your GitHub connection' : 'Could not verify repository with GitHub' },
      { status: 422 }
    )
  }
  const repo = await repoRes.json()
  const branch = typeof defaultBranch === 'string' && defaultBranch ? defaultBranch : repo.default_branch

  await query(
    `INSERT INTO user_selected_github_repos (user_id, repo_full_name, default_branch)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, repo_full_name) DO UPDATE SET default_branch = EXCLUDED.default_branch`,
    [userId, repo.full_name, branch]
  )

  return NextResponse.json({ ok: true, fullName: repo.full_name, defaultBranch: branch })
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const fullName = searchParams.get('fullName')

  if (!fullName) {
    // No specific repo named: clear every selection for this seller.
    await query('DELETE FROM user_selected_github_repos WHERE user_id = $1', [userId])
    return NextResponse.json({ ok: true })
  }

  await query(
    'DELETE FROM user_selected_github_repos WHERE user_id = $1 AND repo_full_name = $2',
    [userId, fullName]
  )
  return NextResponse.json({ ok: true })
}
