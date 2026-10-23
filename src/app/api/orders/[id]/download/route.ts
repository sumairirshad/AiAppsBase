import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { downloadDeliverableStream } from '@/lib/sftp'
import { decryptToken } from '@/lib/token-crypto'
import { resolveOrderDeliverable } from '@/lib/product-versions'
import { rateLimit } from '@/lib/rate-limit'

function streamDeliverable(webStream: ReadableStream, fileName: string, size?: number, contentType = 'application/octet-stream') {
  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
    'Content-Type': contentType,
  }
  if (size) headers['Content-Length'] = String(size)
  return new NextResponse(webStream, { headers })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // AUD finding: downloads had no rate limiting at all — a leaked/guessed
  // order id (or a buyer's own script) could hammer this endpoint, each hit
  // opening a fresh SFTP connection or GitHub API call.
  const limited = await rateLimit(req, 'orders:download', 20, 60)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderRes = await query(
    `SELECT o.buyer_id, o.status, o.product_id, o.product_version_id,
            u.github_access_token AS seller_github_access_token
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users u ON u.id = p.seller_id
     WHERE o.id = $1`,
    [params.id]
  )

  if ((orderRes.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const order = orderRes.rows[0]

  // IDOR protection: an order id alone (even guessed/enumerated) never
  // grants a download — it must belong to the requesting buyer.
  if (order.buyer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status !== 'completed') {
    return NextResponse.json(
      { error: 'This order is not eligible for download (it may have been refunded or disputed).' },
      { status: 400 }
    )
  }

  // Resolves the EXACT version this order is entitled to — never the
  // product's current/latest version — so a seller publishing a newer
  // release can never silently change what an existing buyer's download
  // link returns. See lib/product-versions.ts.
  const deliverable = await resolveOrderDeliverable(order.product_id, order.product_version_id)
  if (!deliverable) {
    return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
  }

  if (deliverable.deliverableRemotePath) {
    // Primary path, for every manual-upload product and every GitHub-sourced
    // version that has been through snapshotting (see @/lib/github-snapshot
    // and @/lib/product-versions): the deliverable already sits in our own
    // SFTP storage, so this never depends on GitHub, the seller's token, or
    // anything the buyer does or doesn't have — identical code path for
    // public and private repos, and for buyers with or without a GitHub
    // account. The remote path itself is never sent to the client; only the
    // streamed bytes are.
    try {
      const { stream, size } = await downloadDeliverableStream(deliverable.deliverableRemotePath)
      const webStream = Readable.toWeb(stream as Readable) as ReadableStream
      return streamDeliverable(webStream, deliverable.deliverableOriginalName || 'download', size)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[orders/download] SFTP fetch failed:', message, err)
      return NextResponse.json({ error: 'Could not reach file storage server. Please try again shortly.' }, { status: 502 })
    }
  }

  // Legacy fallback: a GitHub-sourced version resolved above (either the
  // order's own entitled version, or the pre-versioning backfilled "legacy"
  // row — see migration 030) has no stored snapshot yet. Rather than
  // breaking downloads for buyers who already paid for one of these, fetch
  // it live the same way the old pre-snapshot code path did. New approvals
  // and seller-triggered refreshes always populate deliverableRemotePath
  // above instead, so this branch only fires for pre-snapshot listings.
  if (deliverable.githubRepoName) {
    const branch = deliverable.githubBranch || 'main'
    const accessToken = decryptToken(order.seller_github_access_token)

    if (accessToken) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${deliverable.githubRepoName}/zipball/${branch}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'AIAppsBase-App',
          },
        })

        if (ghRes.ok && ghRes.body) {
          const repoSlug = deliverable.githubRepoName.split('/').pop() || 'repo'
          return streamDeliverable(ghRes.body as unknown as ReadableStream, `${repoSlug}-${branch}.zip`, undefined, 'application/zip')
        }

        console.error(
          '[orders/download] legacy GitHub zipball fetch failed:',
          ghRes.status,
          await ghRes.text().catch(() => '')
        )
      } catch (err) {
        console.error('[orders/download] legacy GitHub zipball fetch error:', err)
      }
    }

    try {
      const publicRes = await fetch(
        `https://github.com/${deliverable.githubRepoName}/archive/refs/heads/${branch}.zip`
      )

      if (publicRes.ok && publicRes.body) {
        const repoSlug = deliverable.githubRepoName.split('/').pop() || 'repo'
        return streamDeliverable(publicRes.body as unknown as ReadableStream, `${repoSlug}-${branch}.zip`, undefined, 'application/zip')
      }
    } catch (err) {
      console.error('[orders/download] legacy public archive fetch error:', err)
    }

    console.error(
      '[orders/download] Unable to fetch legacy (pre-snapshot) deliverable for repo',
      deliverable.githubRepoName,
      'branch', branch
    )
    return NextResponse.json(
      {
        error:
          "This product's files couldn't be retrieved. The seller's GitHub connection needs to be reconnected — please contact support or the seller.",
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
}
