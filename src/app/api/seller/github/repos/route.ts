import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { decryptToken } from '@/lib/token-crypto'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRes = await query(
    'SELECT github_access_token, github_username FROM users WHERE id = $1',
    [userId]
  )

  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { github_access_token, github_username } = userRes.rows[0]

  const accessToken = decryptToken(github_access_token)

  if (!accessToken || !github_username) {
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [] })
  }

  const reposRes = await fetch(
    'https://api.github.com/user/repos?type=public&sort=updated&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AIAppsBase-App',
      },
    }
  )

  if (!reposRes.ok) {
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [], error: 'Failed to fetch repos from GitHub' })
  }

  const rawRepos = await reposRes.json()

  const listedRes = await query(
    "SELECT github_repo_name FROM products WHERE seller_id = $1 AND github_repo_name IS NOT NULL",
    [userId]
  )
  const listedRepoNames: string[] = listedRes.rows.map((r: { github_repo_name: string }) => r.github_repo_name)

  const repos = (rawRepos as Record<string, unknown>[]).map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? null,
    language: r.language ?? null,
    stars: r.stargazers_count,
    forks: r.forks_count,
    updatedAt: r.updated_at,
    defaultBranch: r.default_branch,
    htmlUrl: r.html_url,
    topics: r.topics ?? [],
  }))

  return NextResponse.json({ connected: true, githubUsername: github_username, repos, listedRepoNames })
}
