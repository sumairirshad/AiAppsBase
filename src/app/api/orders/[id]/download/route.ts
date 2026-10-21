import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { downloadDeliverableStream } from '@/lib/sftp'
import { decryptToken } from '@/lib/token-crypto'

function streamDeliverable(webStream: ReadableStream, fileName: string, size?: number, contentType = 'application/octet-stream') {
  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
    'Content-Type': contentType,
  }
  if (size) headers['Content-Length'] = String(size)
  return new NextResponse(webStream, { headers })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderRes = await query(
    `SELECT o.buyer_id, o.status, p.github_repo_name, p.github_default_branch,
            p.deliverable_remote_path, p.deliverable_original_name,
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

  if (order.buyer_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status !== 'completed') {
    return NextResponse.json({ error: 'This order is not eligible for download' }, { status: 400 })
  }

  // Primary path, for every manual-upload product and every GitHub-sourced
  // product that has been through admin-approval snapshotting (see
  // @/lib/github-snapshot): the deliverable already sits in our own SFTP
  // storage, so this never depends on GitHub, the seller's token, or
  // anything the buyer does or doesn't have — identical code path for
  // public and private repos, and for buyers with or without a GitHub
  // account. The remote path itself is never sent to the client; only the
  // streamed bytes are.
  if (order.deliverable_remote_path) {
    try {
      const { stream, size } = await downloadDeliverableStream(order.deliverable_remote_path)
      const webStream = Readable.toWeb(stream as Readable) as ReadableStream
      return streamDeliverable(webStream, order.deliverable_original_name || 'download', size)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[orders/download] SFTP fetch failed:', message, err)
      return NextResponse.json({ error: 'Could not reach file storage server' }, { status: 502 })
    }
  }

  // Legacy fallback: a GitHub-sourced product approved before snapshotting
  // existed has github_repo_name set but no stored deliverable yet. Rather
  // than breaking downloads for buyers who already paid for one of these,
  // fetch it live the same way the old code path did. New approvals always
  // populate deliverable_remote_path above instead, so this branch should
  // only ever fire for pre-migration listings (and will stop firing for a
  // given product the moment a seller syncs or an admin re-approves it).
  if (order.github_repo_name) {
    const branch = order.github_default_branch || 'main'
    const accessToken = decryptToken(order.seller_github_access_token)

    if (accessToken) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${order.github_repo_name}/zipball/${branch}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github+json',
              'User-Agent': 'AIAppsBase-App',
            },
          }
        )

        if (ghRes.ok && ghRes.body) {
          const repoSlug = order.github_repo_name.split('/').pop() || 'repo'
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
        `https://github.com/${order.github_repo_name}/archive/refs/heads/${branch}.zip`
      )

      if (publicRes.ok && publicRes.body) {
        const repoSlug = order.github_repo_name.split('/').pop() || 'repo'
        return streamDeliverable(publicRes.body as unknown as ReadableStream, `${repoSlug}-${branch}.zip`, undefined, 'application/zip')
      }
    } catch (err) {
      console.error('[orders/download] legacy public archive fetch error:', err)
    }

    console.error(
      '[orders/download] Unable to fetch legacy (pre-snapshot) deliverable for repo',
      order.github_repo_name,
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
