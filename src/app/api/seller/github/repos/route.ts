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
    'SELECT role, github_access_token, github_username FROM users WHERE id = $1',
    [userId]
  )

  if ((userRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const { role, github_access_token, github_username } = userRes.rows[0]
  if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const selectionRes = await query(
    'SELECT repo_full_name, default_branch FROM user_selected_github_repos WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  )
  const selections: { repo_full_name: string; default_branch: string }[] = selectionRes.rows

  const accessToken = decryptToken(github_access_token)

  if (!accessToken || !github_username) {
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [], selectedRepos: [] })
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
    return NextResponse.json({ connected: false, repos: [], listedRepoNames: [], selectedRepos: [], error: 'Failed to fetch repos from GitHub' })
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

  const selectedRepos = selections.map((s) => {
    const live = repos.find((r) => r.fullName === s.repo_full_name)
    if (live) return live
    // Selected earlier, but no longer in the live GitHub list — likely
    // renamed, deleted, or access was lost. Still show it, flagged, so the
    // seller can see it and remove it instead of it just silently vanishing.
    return {
      id: s.repo_full_name,
      name: s.repo_full_name.split('/').pop() ?? s.repo_full_name,
      fullName: s.repo_full_name,
      description: null,
      language: null,
      stars: 0,
      forks: 0,
      updatedAt: null,
      defaultBranch: s.default_branch,
      htmlUrl: `https://github.com/${s.repo_full_name}`,
      topics: [],
      private: false,
      unavailable: true,
    }
  })

  return NextResponse.json({ connected: true, githubUsername: github_username, repos, listedRepoNames, selectedRepos })
}
