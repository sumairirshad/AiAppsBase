import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { downloadDeliverableStream } from '@/lib/sftp'
import { decryptToken } from '@/lib/token-crypto'

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

  if (order.github_repo_name) {
    const branch = order.github_default_branch || 'main'
    const accessToken = decryptToken(order.seller_github_access_token)

    // Private repos need an authenticated request — a plain redirect can't carry
    // an Authorization header through the browser. Fetch server-side and stream
    // the archive back to the buyer instead.
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
          return new NextResponse(ghRes.body as unknown as ReadableStream, {
            headers: {
              'Content-Disposition': `attachment; filename="${repoSlug}-${branch}.zip"`,
              'Content-Type': 'application/zip',
            },
          })
        }

        console.error(
          '[orders/download] GitHub zipball fetch failed:',
          ghRes.status,
          await ghRes.text().catch(() => '')
        )
      } catch (err) {
        console.error('[orders/download] GitHub zipball fetch error:', err)
      }
    }

    // Fallback: a direct public-archive link. Only works for public repos, but
    // matches the previous behavior when we don't have a usable seller token.
    const downloadUrl = `https://github.com/${order.github_repo_name}/archive/refs/heads/${branch}.zip`
    return NextResponse.redirect(downloadUrl)
  }

  if (order.deliverable_remote_path) {
    try {
      const { stream, size } = await downloadDeliverableStream(order.deliverable_remote_path)
      const webStream = Readable.toWeb(stream as Readable) as ReadableStream

      const fileName = order.deliverable_original_name || 'download'
      const headers: Record<string, string> = {
        'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
        'Content-Type': 'application/octet-stream',
      }
      if (size) headers['Content-Length'] = String(size)

      return new NextResponse(webStream, { headers })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[orders/download] SFTP fetch failed:', message, err)
      return NextResponse.json({ error: 'Could not reach file storage server' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
}
