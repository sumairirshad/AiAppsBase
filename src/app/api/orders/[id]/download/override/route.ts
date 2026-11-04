import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { verifyPassword } from '@/lib/auth'
import { resolveOrderDeliverable } from '@/lib/product-versions'
import { rateLimit } from '@/lib/rate-limit'
import { streamResolvedDeliverable } from '@/lib/deliverable-stream'
import { getRequestIp, logDownloadAttempt } from '@/lib/download-audit'
import { requestDownloadOverrideOtp, verifyDownloadOverrideOtp } from '@/lib/download-override'

/**
 * Exceptional-download override for a file our security scan flagged as
 * malicious (see /api/orders/[id]/download, which blocks these outright).
 *
 * A buyer who still wants the file after seeing the warning must separately
 * re-prove both: (1) their account password, and (2) control of the
 * account's verified email, via a fresh one-time code — not just an
 * "I agree" click. Every step (code requested, password check result, code
 * check result, final outcome) is written to download_audit_log, so an
 * exceptional download is never just as deniable as a normal one.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = await rateLimit(req, 'orders:download-override', 8, 600)
  if (limited) return limited

  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const step = body.step === 'confirm' ? 'confirm' : 'request_code'

  const ipAddress = getRequestIp(req)
  const userAgent = req.headers.get('user-agent')

  const orderRes = await query(
    `SELECT o.buyer_id, o.status, o.product_id, o.product_version_id, p.seller_id,
            u.github_access_token AS seller_github_access_token,
            b.email AS buyer_email, b.password_hash AS buyer_password_hash
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users u ON u.id = p.seller_id
     JOIN users b ON b.id = o.buyer_id
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
    return NextResponse.json({ error: 'This order is not eligible for download.' }, { status: 400 })
  }

  const deliverable = await resolveOrderDeliverable(order.product_id, order.product_version_id)
  if (!deliverable) {
    return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
  }
  // The override exists for exactly one purpose: letting a buyer accept the
  // risk on a file our own scan flagged. It is never a side door for a file
  // that's merely unscanned/pending, or already confirmed clean — those go
  // through the normal download endpoint (or are blocked there outright).
  if (deliverable.scanStatus !== 'infected') {
    return NextResponse.json(
      { error: 'This file is not flagged — use the regular download link instead.' },
      { status: 400 }
    )
  }

  const auditFields = {
    orderId: params.id, buyerId: userId, sellerId: order.seller_id, productId: order.product_id,
    productVersionId: deliverable.productVersionId,
    fileName: deliverable.deliverableOriginalName, fileSha256: deliverable.deliverableSha256,
    fileSizeBytes: deliverable.deliverableSizeBytes, ipAddress, userAgent, scanStatus: deliverable.scanStatus,
    warningShown: true, overrideRequested: true,
  }

  if (step === 'request_code') {
    const result = await requestDownloadOverrideOtp(userId, order.buyer_email)
    await logDownloadAttempt({ ...auditFields, status: 'blocked', blockReason: 'override_code_requested' })
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.reason === 'locked' ? 429 : 400 })
    }
    return NextResponse.json({ ok: true, message: 'A verification code has been sent to your email.' })
  }

  // step === 'confirm'
  const password = typeof body.password === 'string' ? body.password : ''
  const code = typeof body.code === 'string' ? body.code : ''
  if (!password || !code) {
    return NextResponse.json({ error: 'Password and verification code are required.' }, { status: 400 })
  }

  const passwordOk = await verifyPassword(password, order.buyer_password_hash)
  const otpResult = passwordOk ? await verifyDownloadOverrideOtp(userId, code) : null
  const emailOk = otpResult?.ok ?? false

  if (!passwordOk || !emailOk) {
    await logDownloadAttempt({
      ...auditFields,
      overridePasswordVerified: passwordOk,
      overrideEmailVerified: emailOk,
      status: 'blocked',
      blockReason: !passwordOk ? 'override_bad_password' : `override_bad_code_${otpResult && !otpResult.ok ? otpResult.reason : 'unknown'}`,
    })
    const message = !passwordOk
      ? 'Incorrect password.'
      : otpResult && !otpResult.ok ? otpResult.message : 'Invalid code.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const response = await streamResolvedDeliverable(deliverable, order.seller_github_access_token)
  const succeeded = response.status >= 200 && response.status < 300
  await logDownloadAttempt({
    ...auditFields,
    overridePasswordVerified: true,
    overrideEmailVerified: true,
    status: succeeded ? 'success' : 'failed',
    blockReason: succeeded ? null : `stream_status_${response.status}`,
  })
  return response
}
