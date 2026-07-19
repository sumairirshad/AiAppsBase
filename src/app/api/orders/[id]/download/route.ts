import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { downloadDeliverableStream } from '@/lib/sftp'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderRes = await query(
    `SELECT o.buyer_id, o.status, p.github_repo_name, p.github_default_branch,
            p.deliverable_remote_path, p.deliverable_original_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
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
