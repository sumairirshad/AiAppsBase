import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { resolveOrderDeliverable } from '@/lib/product-versions'
import { rateLimit } from '@/lib/rate-limit'
import { streamResolvedDeliverable } from '@/lib/deliverable-stream'
import { getRequestIp, logDownloadAttempt } from '@/lib/download-audit'

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

  const ipAddress = getRequestIp(req)
  const userAgent = req.headers.get('user-agent')

  const orderRes = await query(
    `SELECT o.buyer_id, o.status, o.product_id, o.product_version_id,
            p.seller_id, u.github_access_token AS seller_github_access_token
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
    await logDownloadAttempt({
      orderId: params.id, buyerId: userId, sellerId: order.seller_id, productId: order.product_id,
      productVersionId: order.product_version_id, fileName: null, fileSha256: null, fileSizeBytes: null,
      ipAddress, userAgent, scanStatus: null, status: 'blocked', blockReason: 'not_order_owner',
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status !== 'completed') {
    await logDownloadAttempt({
      orderId: params.id, buyerId: userId, sellerId: order.seller_id, productId: order.product_id,
      productVersionId: order.product_version_id, fileName: null, fileSha256: null, fileSizeBytes: null,
      ipAddress, userAgent, scanStatus: null, status: 'blocked', blockReason: `order_status_${order.status}`,
    })
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
    await logDownloadAttempt({
      orderId: params.id, buyerId: userId, sellerId: order.seller_id, productId: order.product_id,
      productVersionId: order.product_version_id, fileName: null, fileSha256: null, fileSizeBytes: null,
      ipAddress, userAgent, scanStatus: null, status: 'blocked', blockReason: 'no_deliverable',
    })
    return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
  }

  const auditFields = {
    orderId: params.id, buyerId: userId, sellerId: order.seller_id, productId: order.product_id,
    productVersionId: deliverable.productVersionId,
    fileName: deliverable.deliverableOriginalName, fileSha256: deliverable.deliverableSha256,
    fileSizeBytes: deliverable.deliverableSizeBytes, ipAddress, userAgent, scanStatus: deliverable.scanStatus,
  }

  // Malicious files must remain blocked from normal delivery — no auto
  // download, ever. 'infected' can only be bypassed through the dedicated
  // password + email re-verification override endpoint (see
  // /api/orders/[id]/download/override). 'pending'/'scan_error' have no
  // override at all: this app never serves a file it hasn't confirmed safe
  // (or, for pre-scanning legacy files, never claimed to have scanned).
  if (deliverable.scanStatus === 'infected') {
    await logDownloadAttempt({ ...auditFields, warningShown: true, status: 'blocked', blockReason: 'malware_detected' })
    return NextResponse.json(
      {
        error: 'This file was flagged as malicious by our security scan and cannot be downloaded normally.',
        malwareDetected: true,
        fileName: deliverable.deliverableOriginalName,
      },
      { status: 409 }
    )
  }
  if (deliverable.scanStatus === 'pending' || deliverable.scanStatus === 'scan_error') {
    await logDownloadAttempt({ ...auditFields, status: 'blocked', blockReason: `scan_${deliverable.scanStatus}` })
    return NextResponse.json(
      { error: 'This file is still being verified by our security scan. Please try again shortly.' },
      { status: 409 }
    )
  }

  const response = await streamResolvedDeliverable(deliverable, order.seller_github_access_token)
  await logDownloadAttempt({
    ...auditFields,
    status: response.status >= 200 && response.status < 300 ? 'success' : 'failed',
    blockReason: response.status >= 200 && response.status < 300 ? null : `stream_status_${response.status}`,
  })
  return response
}
