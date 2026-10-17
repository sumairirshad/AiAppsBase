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
    `SELECT role, github_access_token, github_username,
            selected_github_repo, selected_github_repo_branch
     FROM users WHERE id = $1`,
    [userId]
  )

  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const {
    role, github_access_token, github_username,
    selected_github_repo, selected_github_repo_branch,
  } = userRes.rows[0]
  if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accessToken = decryptToken(github_access_token)

  if (!accessToken || !github_username) {
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [], selectedRepo: null })
  }

  // visibility=all (rather than type=public) surfaces private repos too, now
  // that the OAuth connection requests the 'repo' scope.
  const reposRes = await fetch(
    'https://api.github.com/user/repos?visibility=all&affiliation=owner&sort=updated&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AIAppsBase-App',
      },
    }
  )

  if (!reposRes.ok) {
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [], selectedRepo: null, error: 'Failed to fetch repos from GitHub' })
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
    private: r.private ?? false,
  }))

  const selectedRepo = selected_github_repo
    ? (repos.find((r) => r.fullName === selected_github_repo) ?? {
        id: selected_github_repo,
        name: selected_github_repo.split('/').pop() ?? selected_github_repo,
        fullName: selected_github_repo,
        description: null,
        language: null,
        stars: 0,
        forks: 0,
        updatedAt: null,
        defaultBranch: selected_github_repo_branch ?? 'main',
        htmlUrl: `https://github.com/${selected_github_repo}`,
        topics: [],
        private: false,
        unavailable: true,
      })
    : null

  return NextResponse.json({ connected: true, githubUsername: github_username, repos, listedRepoNames, selectedRepo })
}
