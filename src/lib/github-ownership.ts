import { Readable } from 'stream'

const GITHUB_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'AIAppsBase-App',
})

export class GithubApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GithubApiError'
    this.status = status
  }
}

/**
 * True only if the authenticated seller actually has push access to this
 * repo — i.e. they own it or are a collaborator with write access, not just
 * "the repo happens to be public and they typed its name in".
 *
 * AUD finding: product creation previously accepted `githubRepoName`
 * straight from client-submitted form data with no server-side check that
 * the seller has any relationship to that repo at all — anyone could list
 * someone else's public repo as their own paid product.
 *
 * Returns a structured result rather than throwing for the common cases
 * (not found, no access) so callers can show a precise error; throws
 * GithubApiError only for genuine infrastructure failures (rate limit,
 * network, 5xx) where "you don't own this repo" would be a misleading
 * message.
 */
export async function verifyGithubRepoOwnership(
  accessToken: string,
  repoFullName: string
): Promise<{ ok: true; defaultBranch: string } | { ok: false; reason: 'not_found' | 'no_write_access' }> {
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: GITHUB_HEADERS(accessToken),
  })

  if (res.status === 404) return { ok: false, reason: 'not_found' }
  if (res.status === 403 || res.status === 429) {
    throw new GithubApiError(
      res.headers.get('x-ratelimit-remaining') === '0'
        ? 'GitHub API rate limit reached. Please try again in a few minutes.'
        : 'GitHub rejected the request (403). Please try again shortly.',
      res.status
    )
  }
  if (!res.ok) {
    throw new GithubApiError(`GitHub API error (${res.status}) while checking repository access.`, res.status)
  }

  const repo = await res.json()
  const hasWriteAccess = Boolean(repo?.permissions?.push || repo?.permissions?.admin || repo?.permissions?.maintain)
  if (!hasWriteAccess) return { ok: false, reason: 'no_write_access' }

  return { ok: true, defaultBranch: repo.default_branch || 'main' }
}

/** Resolves a branch/tag/ref to the exact commit SHA it currently points at. */
export async function resolveCommitSha(accessToken: string, repoFullName: string, ref: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repoFullName}/commits/${encodeURIComponent(ref)}`, {
    headers: { ...GITHUB_HEADERS(accessToken), Accept: 'application/vnd.github.sha' },
  })
  if (res.status === 404) throw new GithubApiError(`Branch or ref "${ref}" was not found on this repository.`, 404)
  if (res.status === 403 || res.status === 429) {
    throw new GithubApiError('GitHub API rate limit reached while resolving the commit. Please try again shortly.', res.status)
  }
  if (!res.ok) throw new GithubApiError(`GitHub API error (${res.status}) while resolving the commit.`, res.status)
  const sha = (await res.text()).trim()
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new GithubApiError('GitHub returned an unexpected commit SHA format.')
  return sha
}

/**
 * Streams the zipball archive for one exact commit. Fetching by commit SHA
 * (rather than by branch name) is what makes the resulting snapshot
 * reproducible: a branch can move, but a commit SHA's content never
 * changes. The response body is a web ReadableStream; callers that need to
 * pipe it into a Node stream-based API (e.g. SFTP upload) should wrap it
 * with Readable.fromWeb.
 */
export async function fetchGithubCommitZipballStream(
  accessToken: string,
  repoFullName: string,
  commitSha: string
): Promise<Readable> {
  const res = await fetch(`https://api.github.com/repos/${repoFullName}/zipball/${commitSha}`, {
    headers: GITHUB_HEADERS(accessToken),
    redirect: 'follow',
  })
  if (res.status === 403 || res.status === 429) {
    throw new GithubApiError('GitHub API rate limit reached while fetching the archive. Please try again shortly.', res.status)
  }
  if (!res.ok || !res.body) {
    throw new GithubApiError(`GitHub API error (${res.status}) while fetching the archive for this commit.`, res.status)
  }
  return Readable.fromWeb(res.body as unknown as import('stream/web').ReadableStream)
}
