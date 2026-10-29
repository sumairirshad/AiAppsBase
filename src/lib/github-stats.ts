import { query } from '@/lib/db'
import { decryptToken } from '@/lib/token-crypto'
import { fetchGithubFundingLinks, type FundingLink } from '@/lib/github-funding'

export type GithubRepoStats = {
  stars: number
  forks: number
  watchers: number
  issues: number
  commits: number
  contributors: number
}

const GITHUB_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'AIAppsBase-App',
})

/**
 * Reads the total-item count off a paginated GitHub endpoint without
 * fetching every page: GitHub returns a `Link: <...&page=N>; rel="last"`
 * header on the first page, where N is the total page count. Requesting
 * per_page=1 makes that page count equal the total item count.
 */
function totalFromLinkHeader(res: Response, fallbackCount: number): number {
  const link = res.headers.get('link')
  if (!link) return fallbackCount
  const match = /[?&]page=(\d+)[^>]*>;\s*rel="last"/.exec(link)
  return match ? Number(match[1]) : fallbackCount
}

/**
 * Fetches a repo's current stars/forks/watchers/issues/commits/contributors
 * from the GitHub API. Returns null if the repo can't be reached (private,
 * renamed, deleted, or the token is no longer valid) rather than throwing —
 * callers should leave the existing stored values alone in that case.
 */
export async function fetchGithubRepoStats(
  accessToken: string,
  repoFullName: string,
  defaultBranch?: string
): Promise<GithubRepoStats | null> {
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: GITHUB_HEADERS(accessToken),
    })
    if (!repoRes.ok) return null
    const repo = await repoRes.json()

    const [contributorsRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoFullName}/contributors?per_page=1&anon=true`, {
        headers: GITHUB_HEADERS(accessToken),
      }),
      fetch(
        `https://api.github.com/repos/${repoFullName}/commits?per_page=1${defaultBranch ? `&sha=${defaultBranch}` : ''}`,
        { headers: GITHUB_HEADERS(accessToken) }
      ),
    ])

    const contributorsBody = contributorsRes.ok ? await contributorsRes.json().catch(() => []) : []
    const commitsBody = commitsRes.ok ? await commitsRes.json().catch(() => []) : []

    return {
      stars: Number(repo.stargazers_count) || 0,
      forks: Number(repo.forks_count) || 0,
      watchers: Number(repo.subscribers_count ?? repo.watchers_count) || 0,
      issues: Number(repo.open_issues_count) || 0,
      commits: commitsRes.ok ? totalFromLinkHeader(commitsRes, Array.isArray(commitsBody) ? commitsBody.length : 0) : 0,
      contributors: contributorsRes.ok
        ? totalFromLinkHeader(contributorsRes, Array.isArray(contributorsBody) ? contributorsBody.length : 0)
        : 0,
    }
  } catch (error) {
    console.error('[github-stats] failed to fetch stats for', repoFullName, error)
    return null
  }
}

/**
 * Looks up the seller's GitHub token, fetches current stats (and declared
 * funding/sponsorship links) for their repo, and writes them onto the
 * product row. Best-effort: any failure (no token, repo unreachable,
 * rate-limited) is logged and swallowed — the product keeps whatever
 * stats/funding links it already had rather than blocking product
 * creation or a manual refresh on GitHub being reachable. Funding links
 * are synced independently of stats succeeding or not: a null result
 * (couldn't be checked) leaves the stored value untouched, rather than
 * wiping out a previously detected funding link.
 */
export async function syncProductGithubStats(
  productId: string,
  sellerId: string,
  repoFullName: string,
  defaultBranch?: string | null
): Promise<(GithubRepoStats & { fundingLinks: FundingLink[] }) | null> {
  try {
    const userRes = await query<{ github_access_token: string | null }>(
      'SELECT github_access_token FROM users WHERE id = $1',
      [sellerId]
    )
    const accessToken = decryptToken(userRes.rows[0]?.github_access_token ?? null)
    if (!accessToken) return null

    const [stats, fundingLinks] = await Promise.all([
      fetchGithubRepoStats(accessToken, repoFullName, defaultBranch ?? undefined),
      fetchGithubFundingLinks(accessToken, repoFullName),
    ])
    if (!stats) return null

    await query(
      `UPDATE products SET stars = $1, forks = $2, watchers = $3, issues = $4, commits = $5, contributors = $6,
         funding_links = COALESCE($7::jsonb, funding_links)
       WHERE id = $8`,
      [
        stats.stars, stats.forks, stats.watchers, stats.issues, stats.commits, stats.contributors,
        fundingLinks !== null ? JSON.stringify(fundingLinks) : null,
        productId,
      ]
    )
    return { ...stats, fundingLinks: fundingLinks ?? [] }
  } catch (error) {
    console.error('[github-stats] failed to sync stats for product', productId, error)
    return null
  }
}
