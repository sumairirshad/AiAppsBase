import { query } from '@/lib/db'
import { decryptToken } from '@/lib/token-crypto'
import { uploadDeliverable, deleteDeliverable } from '@/lib/sftp'

/**
 * Snapshot-based delivery for GitHub-sourced products.
 *
 * Buyers of a repo-backed product never touch GitHub, and never need a
 * GitHub account or repo access of their own. Instead, the seller's own
 * GitHub connection is used — server-side, once — to fetch the repo archive
 * and store it through the exact same SFTP deliverable storage manual-upload
 * products already use (`uploadDeliverable` / `deliverable_remote_path`).
 * From then on, the buyer-facing download route just streams that stored
 * file, identically for public and private repos, with no live dependency
 * on the seller's token staying valid.
 *
 * This module never throws out of its two exported entry points —
 * `verifyGithubRepoAccess` and `snapshotGithubRepo` both return a
 * structured ok/fail result, since callers use them to produce user-facing
 * error messages (at product creation, at admin approval, and on a
 * seller-triggered refresh) rather than to crash a request.
 */

const GITHUB_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'AIAppsBase-App',
})

export type GithubRepoVerification =
  | { ok: true; private: boolean; branchSha: string }
  | { ok: false; reason: string }

/**
 * Confirms, using the seller's own GitHub token, that:
 * - the token is present and still valid (seller authorization)
 * - the repo exists and the token can see it — a private repo the token
 *   can't access 404s exactly the same as a repo that doesn't exist, which
 *   is the correct outcome to block on either way
 * - the selected branch actually exists on that repo
 *
 * Also returns the repo's real current visibility, since the seller's
 * selection UI can only show what GitHub reported at selection time.
 */
export async function verifyGithubRepoAccess(
  accessToken: string | null,
  repoFullName: string,
  branch: string
): Promise<GithubRepoVerification> {
  if (!accessToken) {
    return {
      ok: false,
      reason: 'Your GitHub connection is missing or invalid. Reconnect GitHub in your seller panel and try again.',
    }
  }

  let repoRes: Response
  try {
    repoRes = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers: GITHUB_HEADERS(accessToken) })
  } catch (err) {
    return { ok: false, reason: `Could not reach GitHub: ${err instanceof Error ? err.message : 'network error'}` }
  }
  if (repoRes.status === 401 || repoRes.status === 403) {
    return {
      ok: false,
      reason: 'Your GitHub connection no longer has access to this repository. Reconnect GitHub and try again.',
    }
  }
  if (repoRes.status === 404) {
    return { ok: false, reason: `Repository "${repoFullName}" was not found, or your GitHub connection can't see it.` }
  }
  if (!repoRes.ok) {
    return { ok: false, reason: `GitHub returned an unexpected error (${repoRes.status}) while checking the repository.` }
  }
  const repo = await repoRes.json()

  let branchRes: Response
  try {
    branchRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/branches/${encodeURIComponent(branch)}`,
      { headers: GITHUB_HEADERS(accessToken) }
    )
  } catch (err) {
    return { ok: false, reason: `Could not reach GitHub: ${err instanceof Error ? err.message : 'network error'}` }
  }
  if (branchRes.status === 404) {
    return { ok: false, reason: `Branch "${branch}" was not found on ${repoFullName}. It may have been renamed or deleted.` }
  }
  if (!branchRes.ok) {
    return { ok: false, reason: `GitHub returned an unexpected error (${branchRes.status}) while checking the branch.` }
  }
  const branchData = await branchRes.json()

  return { ok: true, private: Boolean(repo.private), branchSha: branchData?.commit?.sha ?? '' }
}

class ZipballFetchError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

/** A thrown network-level error (DNS, connection reset, timeout) or a 5xx/429 from GitHub — worth one retry. A 4xx is a configuration problem a retry can't fix. */
function isRetryableZipballError(err: unknown): boolean {
  if (err instanceof ZipballFetchError) {
    return err.status === undefined || err.status >= 500 || err.status === 429
  }
  return err instanceof Error
}

async function fetchZipballOnce(accessToken: string, repoFullName: string, branch: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.github.com/repos/${repoFullName}/zipball/${encodeURIComponent(branch)}`,
    { headers: GITHUB_HEADERS(accessToken) }
  )
  if (!res.ok || !res.body) {
    throw new ZipballFetchError(`GitHub zipball request failed with status ${res.status}`, res.status)
  }
  return Buffer.from(await res.arrayBuffer())
}

const MAX_ZIP_FETCH_ATTEMPTS = 2
const ZIP_RETRY_DELAY_MS = 1_000

async function fetchZipballWithRetry(accessToken: string, repoFullName: string, branch: string): Promise<Buffer> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_ZIP_FETCH_ATTEMPTS; attempt++) {
    try {
      return await fetchZipballOnce(accessToken, repoFullName, branch)
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ZIP_FETCH_ATTEMPTS && isRetryableZipballError(err)) {
        console.warn('[github-snapshot] zipball fetch failed, retrying:', repoFullName, branch, err)
        await new Promise((resolve) => setTimeout(resolve, ZIP_RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Unknown error fetching zipball')
}

export type SnapshotResult =
  | { ok: true; private: boolean; commitSha: string; remotePath: string; sizeBytes: number }
  | { ok: false; error: string }

/**
 * Fetches the repo archive using the seller's GitHub connection and stores
 * it via the shared SFTP deliverable storage, then — only once the new file
 * is safely stored — points the product row at it and cleans up whatever it
 * previously pointed at.
 *
 * On any failure (bad token, repo/branch gone, network error, storage
 * error) nothing about the product's existing deliverable is touched: a
 * failed refresh of an already-live product leaves buyers downloading the
 * last good snapshot, not nothing. The product's `github_snapshot_status`
 * is still recorded as 'failed' with the reason, so the seller/admin see it.
 */
export async function snapshotGithubRepo(
  productId: string,
  sellerId: string,
  repoFullName: string,
  branch: string
): Promise<SnapshotResult> {
  const recordFailure = async (error: string) => {
    await query(
      `UPDATE products SET github_snapshot_status = 'failed', github_snapshot_error = $1, updated_at = NOW() WHERE id = $2`,
      [error, productId]
    )
    return { ok: false as const, error }
  }

  const userRes = await query<{ github_access_token: string | null }>(
    'SELECT github_access_token FROM users WHERE id = $1',
    [sellerId]
  )
  const accessToken = decryptToken(userRes.rows[0]?.github_access_token ?? null)

  const verification = await verifyGithubRepoAccess(accessToken, repoFullName, branch)
  if (!verification.ok) {
    console.error('[github-snapshot] verification failed:', productId, repoFullName, branch, verification.reason)
    return recordFailure(verification.reason)
  }

  let buffer: Buffer
  try {
    buffer = await fetchZipballWithRetry(accessToken as string, repoFullName, branch)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[github-snapshot] zipball fetch failed:', productId, repoFullName, branch, err)
    return recordFailure(`Could not download the repository archive from GitHub: ${message}`)
  }

  const existingRes = await query<{ deliverable_remote_path: string | null }>(
    'SELECT deliverable_remote_path FROM products WHERE id = $1',
    [productId]
  )
  const previousRemotePath = existingRes.rows[0]?.deliverable_remote_path ?? null

  const repoSlug = repoFullName.split('/').pop() || 'repo'
  const fileName = `${repoSlug}-${branch}.zip`

  let remotePath: string
  try {
    const uploaded = await uploadDeliverable(buffer, productId, fileName)
    remotePath = uploaded.remotePath
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[github-snapshot] SFTP store failed:', productId, repoFullName, branch, err)
    return recordFailure(`Downloaded the repository but could not store it: ${message}`)
  }

  await query(
    `UPDATE products SET
      deliverable_remote_path = $1, deliverable_original_name = $2, deliverable_size_bytes = $3,
      github_repo_private = $4, github_snapshot_status = 'ready', github_snapshot_commit_sha = $5,
      github_snapshot_fetched_at = NOW(), github_snapshot_error = NULL, updated_at = NOW()
     WHERE id = $6`,
    [remotePath, fileName, buffer.length, verification.private, verification.branchSha, productId]
  )

  if (previousRemotePath && previousRemotePath !== remotePath) {
    deleteDeliverable(previousRemotePath).catch((err) =>
      console.error('[github-snapshot] failed to clean up previous snapshot:', productId, previousRemotePath, err)
    )
  }

  return { ok: true, private: verification.private, commitSha: verification.branchSha, remotePath, sizeBytes: buffer.length }
}
