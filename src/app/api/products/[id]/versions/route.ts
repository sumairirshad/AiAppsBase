import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { decryptToken } from '@/lib/token-crypto'
import { receiveMultipartUpload } from '@/lib/multipart-stream'
import { createArchiveSignatureValidator, ByteCounterHasher, InvalidArchiveSignatureError } from '@/lib/archive-signature'
import { buildVersionRemotePath, uploadStreamToDeliverablePath, statRemoteDeliverable, deleteDeliverable } from '@/lib/sftp'
import {
  normalizeVersionString, reserveProductVersion, finalizeProductVersion, failProductVersion, listProductVersions,
} from '@/lib/product-versions'
import { GithubApiError, fetchGithubCommitZipballStream, resolveCommitSha, verifyGithubRepoOwnership } from '@/lib/github-ownership'
import { rateLimit } from '@/lib/rate-limit'

const MAX_RELEASE_NOTES_LENGTH = 4000

/** Version history for a product — full detail for its seller, published-only for everyone else. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()

  const productRes = await query('SELECT id, seller_id, status FROM products WHERE id = $1', [params.id])
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  const product = productRes.rows[0]
  const isOwner = userId && product.seller_id === userId

  if (isOwner) {
    return NextResponse.json({ versions: await listProductVersions(params.id, userId) })
  }

  if (product.status !== 'approved') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const res = await query(
    `SELECT id, version, release_notes, published_at, is_legacy_snapshot,
            (SELECT current_version_id FROM products WHERE id = $1) = product_versions.id AS is_current
     FROM product_versions
     WHERE product_id = $1 AND status = 'published'
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    [params.id]
  )
  return NextResponse.json({
    versions: res.rows.map((r: any) => ({
      id: r.id,
      version: r.version,
      releaseNotes: r.release_notes,
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
      isCurrent: Boolean(r.is_current),
      isLegacySnapshot: r.is_legacy_snapshot,
    })),
  })
}

/**
 * Publishes a new immutable version of a product — either a ZIP/RAR upload
 * (multipart/form-data) or a GitHub commit snapshot (application/json).
 *
 * Streams a ZIP/RAR deliverable of any size straight to SFTP storage (see
 * lib/multipart-stream.ts + lib/sftp.ts#uploadStreamToDeliverablePath) —
 * there is no app-level file size cap here. The version string is reserved
 * before any upload/network I/O starts (lib/product-versions.ts), and the
 * version is only marked published, and the product's current_version_id
 * only updated, after the deliverable is confirmed safely stored — never
 * before.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(req, 'products:publish-version', 10, 60)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const productRes = await query('SELECT id, seller_id, title FROM products WHERE id = $1 AND seller_id = $2', [params.id, userId])
  if ((productRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const contentType = req.headers.get('content-type') || ''

  if (contentType.toLowerCase().includes('multipart/form-data')) {
    return publishUploadVersion(req, params.id, userId)
  }
  return publishGithubVersion(req, params.id, userId)
}

function parseNotifyBuyers(raw: unknown): boolean {
  return raw === 'true' || raw === true || raw === 'on' || raw === '1'
}

function parseReleaseNotes(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  return trimmed.slice(0, MAX_RELEASE_NOTES_LENGTH)
}

async function publishUploadVersion(req: NextRequest, productId: string, sellerId: string) {
  let versionId: string | null = null
  // A plain `let outcome: T | null` here defeats TypeScript's narrowing once
  // read back after the closure below reassigns it (it infers `never`), so
  // this uses a one-field mutable ref object instead.
  const outcomeRef: { value: { status: number; body: Record<string, unknown> } | null } = { value: null }

  try {
    const { fields, fileReceived } = await receiveMultipartUpload(req, 'deliverableFile', async (filename, _mimeType, stream) => {
      // Fields appended before the file field in the seller UI's FormData
      // (see panel/seller "publish version" form) are already populated by
      // the time this file callback fires — see multipart-stream.ts.
      const versionCheck = normalizeVersionString(fields.version)
      if (!versionCheck.ok) {
        stream.resume()
        outcomeRef.value = { status: 400, body: { error: versionCheck.error } }
        return
      }

      const reserved = await reserveProductVersion(
        productId, sellerId, versionCheck.version, 'upload',
        parseReleaseNotes(fields.releaseNotes), parseNotifyBuyers(fields.notifyBuyers)
      )
      if (!reserved.ok) {
        stream.resume()
        outcomeRef.value = { status: 409, body: { error: reserved.message } }
        return
      }
      versionId = reserved.versionId

      if (!/\.(zip|rar)$/i.test(filename)) {
        stream.resume()
        outcomeRef.value = { status: 400, body: { error: 'The deliverable file must be a .zip or .rar archive' } }
        await failProductVersion(versionId)
        return
      }

      const remotePath = buildVersionRemotePath(productId, versionId, filename)
      const hasher = new ByteCounterHasher()
      try {
        await uploadStreamToDeliverablePath(
          stream.pipe(createArchiveSignatureValidator()).pipe(hasher),
          remotePath
        )

        const storedSize = await statRemoteDeliverable(remotePath)
        if (storedSize !== null && storedSize !== hasher.bytes) {
          throw new Error('Upload verification failed: the stored file size did not match what was sent.')
        }

        await finalizeProductVersion(versionId, productId, {
          remotePath, originalName: filename, sizeBytes: hasher.bytes, sha256: hasher.digestHex(),
        })
      } catch (err) {
        await deleteDeliverable(remotePath).catch(() => {})
        await failProductVersion(versionId)
        if (err instanceof InvalidArchiveSignatureError) {
          outcomeRef.value = { status: 400, body: { error: err.message } }
          return
        }
        throw err
      }
    })

    if (outcomeRef.value) return NextResponse.json(outcomeRef.value.body, { status: outcomeRef.value.status })
    if (!fileReceived) {
      if (versionId) await failProductVersion(versionId)
      return NextResponse.json({ error: 'Please attach a .zip or .rar deliverable file' }, { status: 400 })
    }
    if (!versionId) {
      return NextResponse.json({ error: 'Please enter a version identifier (e.g. 1.0.0).' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, versionId })
  } catch (err) {
    if (versionId) await failProductVersion(versionId).catch(() => {})
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[products/versions] upload publish failed:', message, err)
    return NextResponse.json({ error: `Could not publish this version: ${message}` }, { status: 502 })
  }
}

async function publishGithubVersion(req: NextRequest, productId: string, sellerId: string) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const versionCheck = normalizeVersionString(body.version)
  if (!versionCheck.ok) return NextResponse.json({ error: versionCheck.error }, { status: 400 })

  const repoFullName = typeof body.repoFullName === 'string' ? body.repoFullName.trim() : ''
  if (!/^[^/\s]+\/[^/\s]+$/.test(repoFullName)) {
    return NextResponse.json({ error: 'repoFullName must look like "owner/repo"' }, { status: 400 })
  }
  const requestedRef = typeof body.ref === 'string' && body.ref.trim() ? body.ref.trim() : null
  const releaseNotes = parseReleaseNotes(body.releaseNotes)
  const notifyBuyers = parseNotifyBuyers(body.notifyBuyers)

  const userRes = await query<{ github_access_token: string | null }>('SELECT github_access_token FROM users WHERE id = $1', [sellerId])
  const accessToken = decryptToken(userRes.rows[0]?.github_access_token ?? null)
  if (!accessToken) {
    return NextResponse.json({ error: 'Connect your GitHub account before publishing a GitHub-sourced version.' }, { status: 400 })
  }

  let versionId: string | null = null
  try {
    // AUD finding fix: verify the seller actually has push access to this
    // repo (owner or collaborator with write access) before trusting
    // anything they submitted about it — not just that the repo exists.
    const ownership = await verifyGithubRepoOwnership(accessToken, repoFullName)
    if (!ownership.ok) {
      return NextResponse.json(
        {
          error:
            ownership.reason === 'not_found'
              ? `Repository "${repoFullName}" was not found or is not accessible with your connected GitHub account.`
              : `You don't have write access to "${repoFullName}". Only a repo you own or collaborate on can be listed.`,
        },
        { status: 403 }
      )
    }

    const reserved = await reserveProductVersion(productId, sellerId, versionCheck.version, 'github', releaseNotes, notifyBuyers)
    if (!reserved.ok) {
      return NextResponse.json({ error: reserved.message }, { status: 409 })
    }
    versionId = reserved.versionId

    const branch = requestedRef || ownership.defaultBranch
    const commitSha = await resolveCommitSha(accessToken, repoFullName, branch)
    const zipballStream = await fetchGithubCommitZipballStream(accessToken, repoFullName, commitSha)

    const repoSlug = repoFullName.split('/').pop() || 'repo'
    const fileName = `${repoSlug}-${commitSha.slice(0, 7)}.zip`
    const remotePath = buildVersionRemotePath(productId, versionId, fileName)
    const hasher = new ByteCounterHasher()

    try {
      await uploadStreamToDeliverablePath((zipballStream as unknown as Readable).pipe(hasher), remotePath)

      const storedSize = await statRemoteDeliverable(remotePath)
      if (storedSize !== null && storedSize !== hasher.bytes) {
        throw new Error('Snapshot verification failed: the stored archive size did not match what was fetched from GitHub.')
      }

      await finalizeProductVersion(versionId, productId, {
        remotePath, originalName: fileName, sizeBytes: hasher.bytes, sha256: hasher.digestHex(),
        githubRepoName: repoFullName, githubBranch: branch, githubCommitSha: commitSha,
      })
    } catch (err) {
      await deleteDeliverable(remotePath).catch(() => {})
      await failProductVersion(versionId)
      throw err
    }

    return NextResponse.json({ ok: true, versionId, commitSha })
  } catch (err) {
    if (versionId) await failProductVersion(versionId).catch(() => {})
    if (err instanceof GithubApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : 502 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[products/versions] github publish failed:', message, err)
    return NextResponse.json({ error: `Could not publish this version: ${message}` }, { status: 502 })
  }
}
